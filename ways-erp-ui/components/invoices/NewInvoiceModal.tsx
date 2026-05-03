'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Calculator, Search, UserCheck, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import { invoicesApi } from '@/lib/api/invoices'
import { crmApi } from '@/lib/api/crm'
import { inventoryApi } from '@/lib/api/inventory'
import { getErrorMessage } from '@/lib/api/client'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input, { Select } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils'
import type { Contact, Product } from '@/types'

/* ── schemas ── */
const itemSchema = z.object({
  productId:          z.string().optional(),
  description:        z.string().min(1, 'Required'),
  quantity:           z.coerce.number().positive('Must be > 0'),
  unitPrice:          z.coerce.number().positive('Must be > 0'),
  taxRate:            z.coerce.number().min(0).default(7.5),
  discountPercentage: z.coerce.number().min(0).max(100).default(0),
  hsnCode:            z.string().optional(),
  taxCategoryId:      z.string().default('STANDARD_VAT'),
})

const schema = z.object({
  customerName:         z.string().min(1, 'Customer name is required'),
  customerEmail:        z.string().email().optional().or(z.literal('')),
  customerPhone:        z.string().optional(),
  customerAddress:      z.string().optional(),
  customerCountry:      z.string().optional(),
  customerZone:         z.string().optional(),
  customerTin:          z.string().optional(),
  issueDate:            z.string().min(1, 'Issue date is required'),
  dueDate:              z.string().optional(),
  invoiceTypeCode:      z.string().default('380'),
  currency:             z.string().default('NGN'),
  invoicePaymentStatus: z.enum(['PAID', 'PENDING']).default('PENDING'),
  notes:                z.string().optional(),
  salesOrderId:         z.string().optional(),
  items:                z.array(itemSchema).min(1, 'Add at least one item'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  salesOrderId?: string
  initialCustomerName?: string
}

function calcLine(qty: number, price: number, taxRate: number, discPct: number) {
  const gross = qty * price
  const disc  = gross * (discPct / 100)
  const net   = gross - disc
  const tax   = net * (taxRate / 100)
  return { gross, disc, net, tax, total: net + tax }
}

const today = new Date().toISOString().slice(0, 10)

export default function NewInvoiceModal({ open, onClose, onSuccess, salesOrderId, initialCustomerName }: Props) {
  const [submitting, setSubmitting]           = useState(false)
  const [contactSearch, setContactSearch]     = useState('')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showPicker, setShowPicker]           = useState(false)
  const [productSearch, setProductSearch]     = useState('')
  const [activeProductPicker, setActiveProductPicker] = useState<number | null>(null)

  const {
    register, control, handleSubmit, watch, setValue,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currency: 'NGN',
      invoiceTypeCode: '380',
      invoicePaymentStatus: 'PENDING',
      issueDate: today,
      items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 7.5, discountPercentage: 0, taxCategoryId: 'STANDARD_VAT' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')
  const currency     = watch('currency') || 'NGN'

  useEffect(() => {
    if (open && salesOrderId) {
      setValue('salesOrderId', salesOrderId)
      if (initialCustomerName) setValue('customerName', initialCustomerName)
    }
  }, [open, salesOrderId, initialCustomerName, setValue])

  /* load contacts for picker */
  const { data: contactsData } = useQuery({
    queryKey: ['crm-contacts-picker', contactSearch],
    queryFn: () => (
      contactSearch.length >= 1
        ? crmApi.searchContacts(contactSearch, { page: 0, size: 10 })
        : crmApi.getContacts({ page: 0, size: 20 })
    ).then((r) => r.data.data),
    enabled: open,
  })
  const contacts = contactsData?.content ?? []

  /* load products for line-item picker */
  const { data: productsData } = useQuery({
    queryKey: ['inv-products-picker', productSearch],
    queryFn: () => (
      productSearch.length >= 1
        ? inventoryApi.searchProducts(productSearch, { page: 0, size: 10 })
        : inventoryApi.getProducts({ page: 0, size: 20 })
    ).then((r) => r.data.data),
    enabled: open && activeProductPicker !== null,
  })
  const products: Product[] = productsData?.content ?? []

  function pickProduct(idx: number, p: Product) {
    setValue(`items.${idx}.productId`,    p.id)
    setValue(`items.${idx}.description`,  p.name)
    setValue(`items.${idx}.unitPrice`,    p.sellingPrice)
    const rate = p.taxRate ?? 7.5
    setValue(`items.${idx}.taxRate`,      rate)
    setValue(`items.${idx}.taxCategoryId`, rate === 0 ? 'ZERO_VAT' : 'STANDARD_VAT')
    setActiveProductPicker(null)
    setProductSearch('')
  }

  function pickContact(c: Contact) {
    setSelectedContact(c)
    setValue('customerName',    `${c.firstName} ${c.lastName ?? ''}`.trim())
    setValue('customerEmail',   c.email ?? '')
    setValue('customerPhone',   c.phone ?? '')
    setValue('customerTin',     c.tin ?? '')
    setValue('customerAddress', c.address ?? '')
    setValue('customerCountry', c.country ?? '')
    setValue('customerZone',    c.postalZone ?? '')
    setShowPicker(false)
    setContactSearch('')
  }

  function clearContact() {
    setSelectedContact(null)
    setValue('customerName',    '')
    setValue('customerEmail',   '')
    setValue('customerPhone',   '')
    setValue('customerTin',     '')
    setValue('customerAddress', '')
    setValue('customerCountry', '')
    setValue('customerZone',    '')
  }

  /* totals */
  const totals = watchedItems.reduce(
    (acc, item) => {
      const { net, tax, total } = calcLine(
        Number(item.quantity) || 0,
        Number(item.unitPrice) || 0,
        item.taxRate != null ? Number(item.taxRate) : 7.5,
        Number(item.discountPercentage) || 0
      )
      return { subtotal: acc.subtotal + net, tax: acc.tax + tax, total: acc.total + total }
    },
    { subtotal: 0, tax: 0, total: 0 }
  )

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      await invoicesApi.create({
        customerName:         values.customerName,
        customerEmail:        values.customerEmail || undefined,
        customerPhone:        values.customerPhone || undefined,
        customerAddress:      values.customerAddress || undefined,
        customerCountry:      values.customerCountry || undefined,
        customerZone:         values.customerZone || undefined,
        customerTin:          values.customerTin || undefined,
        issueDate:            values.issueDate,
        dueDate:              values.dueDate || undefined,
        invoiceTypeCode:      values.invoiceTypeCode,
        currency:             values.currency,
        invoicePaymentStatus: values.invoicePaymentStatus,
        notes:                values.notes || undefined,
        salesOrderId:         values.salesOrderId || undefined,
        items: values.items.map((i) => ({
          productId:          i.productId || undefined,
          description:        i.description,
          quantity:           i.quantity,
          unitPrice:          i.unitPrice,
          taxRate:            i.taxRate,
          discountPercentage: i.discountPercentage,
          hsnCode:            i.hsnCode || undefined,
          taxCategoryId:      i.taxCategoryId,
        })),
      })
      toast.success('Invoice created successfully')
      reset()
      setSelectedContact(null)
      setContactSearch('')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    reset()
    setSelectedContact(null)
    setContactSearch('')
    setShowPicker(false)
    setActiveProductPicker(null)
    setProductSearch('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Invoice"
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button loading={submitting} onClick={handleSubmit(onSubmit)}>
            Create Invoice
          </Button>
        </>
      }
    >
      <div className="space-y-6">

        {/* ── Contact picker ── */}
        <div className="bg-gray-50 border border-gray-200 rounded-[10px] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-bold text-gray-700 flex items-center gap-1.5">
              <UserCheck size={14} className="text-green-600" />
              Select from Contacts
              <span className="text-[11px] font-normal text-gray-400 ml-1">— auto-fills all customer details</span>
            </p>
            {selectedContact && (
              <button onClick={clearContact} className="text-[12px] text-gray-400 hover:text-red-500 transition-colors">
                Clear
              </button>
            )}
          </div>

          {selectedContact ? (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-[8px] px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-[12px] flex-shrink-0">
                {selectedContact.firstName[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-gray-900">
                  {selectedContact.firstName} {selectedContact.lastName}
                </p>
                <p className="text-[11px] text-gray-500 flex gap-3 flex-wrap mt-0.5">
                  {selectedContact.email && <span>{selectedContact.email}</span>}
                  {selectedContact.tin && <span>TIN: {selectedContact.tin}</span>}
                </p>
              </div>
              <span className="ml-auto text-[11px] bg-green-600 text-white px-2 py-0.5 rounded-full font-semibold flex-shrink-0">Selected</span>
            </div>
          ) : (
            <>
              <div
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-[6px] px-3 py-2 cursor-text focus-within:border-green-400 transition-colors"
                onClick={() => setShowPicker(true)}
              >
                <Search size={13} className="text-gray-400 flex-shrink-0" />
                <input
                  value={contactSearch}
                  onChange={(e) => { setContactSearch(e.target.value); setShowPicker(true) }}
                  onFocus={() => setShowPicker(true)}
                  placeholder="Search contacts by name or email..."
                  className="flex-1 text-[13px] bg-transparent outline-none placeholder:text-gray-400"
                />
              </div>

              {showPicker && (
                <div className="mt-1 bg-white border border-gray-200 rounded-[8px] shadow-md overflow-hidden">
                  {contacts.length === 0 ? (
                    <p className="text-[13px] text-gray-400 text-center py-4">
                      {contactSearch ? 'No contacts found' : 'No contacts yet — add some in the CRM module'}
                    </p>
                  ) : (
                    contacts.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => pickContact(c)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition-colors text-left"
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-600 to-green-400 flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0">
                          {c.firstName[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-gray-900">
                            {c.firstName} {c.lastName}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {c.email}{c.tin ? ` · TIN: ${c.tin}` : ''}
                          </p>
                        </div>
                        {c.phone && <p className="text-[11px] text-gray-400 flex-shrink-0">{c.phone}</p>}
                      </button>
                    ))
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPicker(false)}
                    className="w-full text-center text-[12px] text-gray-400 py-2 border-t border-gray-100 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Customer information ── */}
        <div>
          <p className="text-[11px] font-bold tracking-[.08em] uppercase text-gray-400 mb-3 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gray-200">
            Customer Information
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Customer Name" required
              error={errors.customerName?.message}
              {...register('customerName')}
              placeholder="Dangote Group"
              hint="Full legal name of the individual or company receiving this invoice"
            />
            <Input
              label="Customer Email"
              error={errors.customerEmail?.message}
              {...register('customerEmail')}
              type="email"
              placeholder="procurement@dangote.com"
              hint="Customer's email for invoice delivery"
            />
            <Input
              label="Customer Phone"
              {...register('customerPhone')}
              placeholder="+2348012345678"
              hint="Customer's phone number"
            />
            <Input
              label="Customer TIN"
              {...register('customerTin')}
              placeholder="12345678-0001"
              hint="Customer's FIRS Tax Identification Number — required for B2B fiscalized invoices"
            />
            <Input
              label="Customer Address"
              {...register('customerAddress')}
              placeholder="1 Dangote Close, Lagos"
              hint="Customer's billing address including street, city, and state"
              className="col-span-2"
            />
            <Select
              label="Customer Country"
              {...register('customerCountry')}
              hint="Country — auto-filled when a contact is selected"
            >
              <option value="">— Select country —</option>
              {[
                { code: 'NG', name: 'Nigeria' }, { code: 'GH', name: 'Ghana' },
                { code: 'KE', name: 'Kenya' }, { code: 'ZA', name: 'South Africa' },
                { code: 'GB', name: 'United Kingdom' }, { code: 'US', name: 'United States' },
                { code: 'AE', name: 'United Arab Emirates' },
              ].map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </Select>
            <Input
              label="Customer Postal Zone"
              {...register('customerZone')}
              placeholder="100001"
              hint="Postal / ZIP code — auto-filled when a contact is selected"
            />
          </div>
        </div>

        {/* ── Invoice settings ── */}
        <div>
          <p className="text-[11px] font-bold tracking-[.08em] uppercase text-gray-400 mb-3 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-gray-200">
            Invoice Settings
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Issue Date" required type="date"
              error={errors.issueDate?.message}
              {...register('issueDate')}
              hint="Date this invoice is issued — required by FIRS for fiscalization"
            />
            <Input
              label="Due Date" type="date"
              {...register('dueDate')}
              hint="Payment due date shown on the invoice"
            />
            <Select
              label="Currency"
              hint="Currency for this invoice. NGN is the default for FIRS-fiscalized invoices."
              {...register('currency')}
            >
              <option value="NGN">NGN — Nigerian Naira</option>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
            </Select>
            <Select
              label="Invoice Type"
              hint="380 = standard invoice. Use 381 for credit notes (refunds) and 383 for debit notes (extra charges)."
              {...register('invoiceTypeCode')}
            >
              <option value="380">380 — Commercial Invoice</option>
              <option value="381">381 — Credit Note</option>
              <option value="383">383 — Debit Note</option>
            </Select>
            <Select
              label="Payment Status"
              hint="Mark whether payment has been received or is still outstanding."
              {...register('invoicePaymentStatus')}
            >
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
            </Select>
          </div>
        </div>

        {/* ── Line items ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold tracking-[.08em] uppercase text-gray-400">Line Items</p>
            <button
              type="button"
              onClick={() => append({ description: '', quantity: 1, unitPrice: 0, taxRate: 7.5, discountPercentage: 0, taxCategoryId: 'STANDARD_VAT' })}
              className="flex items-center gap-1 text-[12px] font-semibold text-green-600 hover:text-green-700 transition-colors"
            >
              <Plus size={14} /> Add item
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, i) => {
              const item = watchedItems[i]
              const { net, tax, total } = calcLine(
                Number(item?.quantity) || 0,
                Number(item?.unitPrice) || 0,
                item?.taxRate != null ? Number(item.taxRate) : 7.5,
                Number(item?.discountPercentage) || 0
              )
              const isPickerOpen = activeProductPicker === i
              return (
                <div key={field.id} className="border border-gray-200 rounded-[10px] p-4 bg-gray-50/50 space-y-3">

                  {/* ── Product picker ── */}
                  <div className="relative">
                    {item?.productId ? (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-[7px] px-3 py-1.5 text-[12px]">
                        <Package size={13} className="text-green-600 flex-shrink-0" />
                        <span className="font-semibold text-green-800 flex-1">{item.description}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setValue(`items.${i}.productId`, undefined)
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors ml-2 text-[11px]"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-2 bg-white border border-dashed border-gray-300 rounded-[7px] px-3 py-1.5 cursor-text focus-within:border-green-400 transition-colors"
                        onClick={() => { setActiveProductPicker(i); setProductSearch('') }}
                      >
                        <Package size={13} className="text-gray-400 flex-shrink-0" />
                        <input
                          value={isPickerOpen ? productSearch : ''}
                          onChange={(e) => { setProductSearch(e.target.value); setActiveProductPicker(i) }}
                          onFocus={() => setActiveProductPicker(i)}
                          placeholder="Search & select product from inventory (optional)..."
                          className="flex-1 text-[12px] bg-transparent outline-none placeholder:text-gray-400"
                        />
                      </div>
                    )}

                    {isPickerOpen && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-[8px] shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                        {products.length === 0 ? (
                          <p className="text-[12px] text-gray-400 text-center py-3">
                            {productSearch ? 'No products found' : 'No products in inventory yet'}
                          </p>
                        ) : (
                          products.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => pickProduct(i, p)}
                              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-green-50 transition-colors text-left"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-gray-900 truncate">{p.name}</p>
                                <p className="text-[11px] text-gray-400">
                                  {p.sku && <span>SKU: {p.sku} · </span>}
                                  Price: {formatCurrency(p.sellingPrice, currency)}
                                  {p.taxRate != null && <span> · VAT: {p.taxRate}%</span>}
                                </p>
                              </div>
                            </button>
                          ))
                        )}
                        <button
                          type="button"
                          onClick={() => setActiveProductPicker(null)}
                          className="w-full text-center text-[11px] text-gray-400 py-1.5 border-t border-gray-100 hover:bg-gray-50"
                        >
                          Close
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── Inputs ── */}
                  <div className="grid grid-cols-[1fr_80px_100px_160px_70px_24px] gap-2 items-end">
                    <Input
                      label={i === 0 ? 'Description' : undefined}
                      {...register(`items.${i}.description`)}
                      placeholder="Service or product description"
                      error={errors.items?.[i]?.description?.message}
                    />
                    <Input
                      label={i === 0 ? 'Qty' : undefined}
                      {...register(`items.${i}.quantity`)}
                      type="number" step="0.01" placeholder="1"
                    />
                    <Input
                      label={i === 0 ? 'Unit Price' : undefined}
                      {...register(`items.${i}.unitPrice`)}
                      type="number" step="0.01" placeholder="0.00"
                    />
                    <Select
                      label={i === 0 ? 'VAT Type' : undefined}
                      value={`${watchedItems[i]?.taxCategoryId ?? 'STANDARD_VAT'}|${watchedItems[i]?.taxRate ?? 7.5}`}
                      onChange={(e) => {
                        const [catId, rate] = e.target.value.split('|')
                        setValue(`items.${i}.taxCategoryId`, catId)
                        setValue(`items.${i}.taxRate`, parseFloat(rate))
                      }}
                    >
                      <option value="STANDARD_VAT|7.5">STANDARD_VAT — Standard VAT (7.5%)</option>
                      <option value="ZERO_VAT|0">ZERO_VAT — Zero-rated VAT (0%)</option>
                      <option value="EXEMPT|0">EXEMPT — VAT Exempt (0%)</option>
                    </Select>
                    <Input
                      label={i === 0 ? 'Disc %' : undefined}
                      {...register(`items.${i}.discountPercentage`)}
                      type="number" step="0.1" placeholder="0"
                    />
                    {fields.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        className={`w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors ${i === 0 ? 'mt-[22px]' : ''}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : <div />}
                  </div>

                  <div className="flex gap-4 text-[12px] text-gray-500 border-t border-gray-200 pt-2">
                    <span>Net: <strong className="text-gray-700">{formatCurrency(net, currency)}</strong></span>
                    <span>Tax: <strong className="text-gray-700">{formatCurrency(tax, currency)}</strong></span>
                    <span className="ml-auto font-bold text-gray-800">Total: {formatCurrency(total, currency)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Notes ── */}
        <div>
          <label className="text-[13px] font-semibold text-gray-700 block mb-[6px]">Notes <span className="text-[12px] font-normal text-gray-400">(optional)</span></label>
          <div className="peer">
            <textarea
              {...register('notes')}
              placeholder="Payment terms, special instructions, or any other notes..."
              rows={2}
              className="w-full px-3 py-[9px] border border-gray-200 rounded-[6px] text-[13.5px] text-gray-800 bg-gray-50 outline-none transition-all focus:border-green-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(34,197,94,.1)] resize-none"
            />
          </div>
          <div className="overflow-hidden max-h-0 opacity-0 peer-focus-within:max-h-10 peer-focus-within:opacity-100 transition-all duration-200">
            <p className="text-[12px] text-green-700 bg-green-50 border border-green-200 rounded-[5px] px-2.5 py-1.5 mt-1">
              Internal or customer-facing notes — e.g. payment terms, bank details, or special instructions
            </p>
          </div>
        </div>

        {/* ── Grand total ── */}
        <div className="bg-green-50 border border-green-200 rounded-[10px] p-4 flex items-center gap-2">
          <Calculator size={16} className="text-green-600 flex-shrink-0" />
          <div className="flex gap-6 text-[13px] flex-1">
            <span className="text-gray-600">Subtotal: <strong className="text-gray-800">{formatCurrency(totals.subtotal, currency)}</strong></span>
            <span className="text-gray-600">VAT: <strong className="text-gray-800">{formatCurrency(totals.tax, currency)}</strong></span>
            <span className="ml-auto text-[15px] font-extrabold text-green-800">
              Total: {formatCurrency(totals.total, currency)}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  )
}