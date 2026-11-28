# BTHAWK Feature Parity Checklist (Web -> Backend -> Mobile)

**Architecture Overview:**
- **Backend:** `bthawk-web-new-application` (NestJS + TypeORM, `JwtAuthGuard` Bearer auth, `session_data.user_role` role checks)
- **Web Dashboard:** `bthawk_new_code_frontend` (React + Vite + Redux + React Query + Tailwind/shadcn)
- **Mobile App:** `bthwak_new_code_mobile` (Expo 58 + Expo Router + React 19.3 + React Native 0.88.1 + React Query + Axios + `expo-secure-store`)

> **Legend:** `DONE` = Implemented & wired to real NestJS API | `PARTIAL` = Exists but has gaps/bugs/dead buttons | `MISSING` = Not yet implemented on Mobile

---

## 1. Authentication, Profile, Settings & QR Login

| Feature | Web Route / Page | Backend Endpoint(s) | Mobile Status | Notes / Action |
|---|---|---|---|---|
| Login (Password / OTP) | `/login` (`login.tsx`) | `POST /login`, `POST /sendOTPForLogin`, `POST /forgot_password` | `DONE` | `(auth)/login.tsx` |
| Registration & GST/PIN Lookup | `/signup` (`signup.tsx`) | `POST /register`, `GET /get_gst_data`, `GET /get_pin_data`, `GET /get_state_list`, `POST /send_otp`, `POST /verify_otp` | `DONE` | `(auth)/register.tsx` |
| QR Login (Web QR + 2m TTL + Mobile Scanner) | `/qr_login` (`qrlogin.tsx`) | `GET /getLoginQrCode`, `GET /checkLoginQrStatus`, `POST /updateLoginQrStatus` | `DONE` | Web 120s TTL + Refresh; Mobile `QrScannerSheet.tsx` accessible from **both** Dashboard & Profile headers |
| Profile & Business Details | `/ProfilePage`, `/businessdetail` | `GET /profile/get_profile_details`, `POST /profile/upload_profile_*`, `GET /profile/get_subscription_details` | `PARTIAL` | `ProfileScreen.tsx` has static Help/Updates/Settings alerts; `api/profile.ts` has silent fallback |
| Settings (Bank, UPI, CA, Password, DSR) | `/ProfilePage` / Settings | `GET/POST /profile/bank_details`, `upi_details`, `save_chartered_details`, `update_password`, `update_dsr_setting` | `PARTIAL` | `SettingsScreen.tsx` bank/UPI/CA/password handlers only update local state |
| FSE Day End Approval / Reject | `/salesExecutiveDayEnd` (`fosdayenddetails.tsx`) | `POST /dashboard/salesExecutivePendingDayEnd`, `salesExecutiveApprovedDayEnd`, `singleDsrApprove`, `bulkDsrApprove` | `MISSING` | Needs FSE Day End Approval screen or wiring |
| Help & Support / FAQ | `/help-support` (`HelpSupport.tsx`) | `GET /dashboard/getFaqDetails` | `PARTIAL` | Dashboard FAQ section exists; `SupportCard.tsx` has placeholder alerts |

---

## 2. Dashboard & Navigation

| Feature | Web Route / Page | Backend Endpoint(s) | Mobile Status | Notes / Action |
|---|---|---|---|---|
| Main Dashboard KPIs & Charts | `/` (`dashboard.tsx`) | `POST /dashboard/getDashboardDetails`, `GET /dashboard/getSalePurchaseChart`, `GET /dashboard/checkDistributorRenewal` | `DONE` | `src/app/dashboard.tsx` (Cash, Bank, Sale/Purchase chart, Date Range, Quick Actions) |
| Drawer Menu & Routing | `app-sidebar.tsx` | N/A | `DONE` | `menu.ts` & `AppDrawer.tsx` |
| Notifications | Header Bell | `GET /notifications`, `GET /notifications/detail`, `PATCH /notifications/read` | `PARTIAL` | `fse.tsx` notification button shows static alert |

---

## 3. Master Management

| Feature | Web Route / Page | Backend Endpoint(s) | Mobile Status | Notes / Action |
|---|---|---|---|---|
| Sales Executive (FSE) Master | `/master/customer` (`saleexecutive.tsx`) | `POST /master/fetch_user`, `update_user`, `update_password`, `update_status`, `clear_credentials`, `stock_return` | `DONE` | `sales-executive.tsx` + `ExecutiveStockReturnModal.tsx` |
| Buyer & Seller Master | `/master/buyer_seller` (`buyer_seller.tsx`) | `POST /master/fetch_buyer`, `add_buyer`, `edit_buyer`, `fetch_seller`, `add_seller`, `edit_seller` | `DONE` | `buyer-seller.tsx` |
| Beat Management | `/master/beat` (`beat.tsx`) | `POST /master/fetch_beat`, `add_beat`, `update_beat`, `assign_beat` | `DONE` | `beat.tsx` |
| Bulk Retailer Movement | `/master/bulkretailer` (`bulkretailer.tsx`) | `POST /master/get_all_fsc`, `assign_sales_executive`, `get_bulk_fsc_details` | `DONE` | `bulkretailer.tsx` |
| Credit Note Detail | `/master/Creditnote` (`main_credit_note_detail.tsx`) | `POST /master/credit_note_detail`, `get_credit_note_detail_list`, `credit_note_adjust`, `GET /master/generate_credit_note_pdf` | `DONE` | `credit-note-detail.tsx` |
| Debit Note Detail | `/debit-note-detail` (`main_debit_note_detail.tsx`) | `POST /master/debit_note_detail`, `get_debit_note_detail_list`, `direct_debit_note_adjust`, `GET /master/generate_debit_note_pdf` | `DONE` | `debit-note-detail.tsx` |
| Party Product Discount | `/master/partyproductdiscount` | `POST /master/fetch_party_discount`, `add_party_discount`, `edit_party_discount`, `update_party_discount_status` | `MISSING` | Add mobile Party Product Discount screen |

---

## 4. Purchase & Stock Request Master

| Feature | Web Route / Page | Backend Endpoint(s) | Mobile Status | Notes / Action |
|---|---|---|---|---|
| Purchase Credit List & Payment | `/purchase/credit_list` (`creditlist.tsx`) | `GET /purchase/getPurchasePartyCreditList`, `PUT /purchase/updateCreditPurchasePayment`, `GET /purchase/generate-payment-receipt-pdf` | `DONE` | `purchase-credit.tsx` + `PurchaseCreditScreen.tsx` |
| Add Stock (Purchase Entry) | `/purchase/add_stock` (`addstock.tsx`) | `POST /purchase/addPurchase`, `purchaseAddToCart`, `updateStockAddReduce`, `GET /purchase/getPurchaseCardDetailList` | `DONE` | `add-stock.tsx` + `PurchaseAddStockScreen.tsx` |
| Generate Debit Note (Stock Return / Direct) | `/purchase/generate_debit_note` (`generatedebitnote.tsx`) | `POST /purchase/generateDirectDebitNote`, `addPurchaseStockReturnInCart`, `generateStockReturnDebitNote` | `PARTIAL` | `AddDebitNoteItemsModal.tsx` ok; verify edge-case stock caps |
| Purchase Return | `/purchase/purchasereturn` (`PurchaseReturn.tsx`) | `GET /purchase/getPurchaseReturnData`, `getPurchaseReturnCartSummary`, `getImeiNumber`, `POST /purchase/purchaseReturnAddCart`, `purchaseReturnFinalSubmit` | `DONE` | Implemented with remaining-qty upper bound check |
| Stock Request Master (Pending, Transfer, Cancelled, Exec Dispatch) | `/pending_request`, `/stock_transfer`, `/cancelled_request`, `/Executive_stocktransfer` | `GET /stock_request/pending_stock`, `POST /stock_request/approve_user_stock_details`, `reject_user_stock_details`, `save_all_cart_details` | `DONE` | Tab 4 Executive Dispatch now enforces `newQuantity` stock cap in cart & stepper |

---

## 5. Product & Wastage / Damage

| Feature | Web Route / Page | Backend Endpoint(s) | Mobile Status | Notes / Action |
|---|---|---|---|---|
| Product Master (Add / Edit / Status / Categories) | `/product/add` (`product.tsx`) | `POST /product/getProductList`, `addEditProduct`, `updateProductStatus`, `getProductCategoryList` | `DONE` | `AddEditProductModal.tsx` guards `< 0` on `stockInHand` / `lowStockQty` |
| Add Payout (Commission Product Payout) | `/add_payout` (`addpayout.tsx`) | `GET /common_api/get_payout_detail`, `POST /product/save_payout_details` | `DONE` | `AddPayoutScreen.tsx` + `add_payout.tsx` |
| Waste / Damage Stock | `/product/waste_damage` (`wastedamage.tsx`) | `POST /product/wastage_stock`, `GET /product/get_add_cart_damage`, `POST /product/save_add_cart_damage`, `del_damage_wastage_cart` | `DONE` | `AddWasteDamageModal.tsx` blocks `0` stock & exceeding `stock_quantity` |

---

## 6. Sales, Billing, Receipts, E-Invoice, E-Way & Multi-Recharge

| Feature | Web Route / Page | Backend Endpoint(s) | Mobile Status | Notes / Action |
|---|---|---|---|---|
| Generate Invoice / Challan / Quotation | `/generate-invoice` (`generateInvoice.tsx`) | `POST /sale/generateSaleInvoice`, `addProductInSaleCart`, `getSaleProductList`, `GET /sale/getFreeSchemProduct` | `DONE` | `AddItemsSheet.tsx` clamps manual qty; `generate-invoice.tsx` supports `Cash`, `Credit`, `Online`, `Cheque`, `Both`; `InvoiceReceiptModal.tsx` opens `/sale/generate-pdf` |
| All Invoices / Challan List | `/invoice` (`allinvoice.tsx`) | `POST /sale/getSaleInvoiceAndChallanDataList`, `GET /sale/challanConvertTaxInvoice`, `DELETE /sale/cancelBillDetail`, `PUT /sale/updateBillMoveToBackDate` | `DONE` | `invoice.tsx` |
| Generate Receipt & Outstanding Payment | `/generate-receipt` (`receipt-generation.tsx`) | `POST /sale/creditReciptlist`, `advance-receipt-submit`, `money-receipt-submit`, `return-receipt/submit`, `GET /sale/generate-receipt-pdf` | `PARTIAL` | `PaymentReceiptSheet.tsx` uses fake `setTimeout` alert instead of real API |
| Receipt Book / Register | `/receipt-book` (`receiptBook.tsx`) | `POST /sale/getReceiptRegister`, `GET /sale/getReceiptTabs`, `POST /sale/cancelCreditReceipt` | `DONE` | `receipt-book.tsx` |
| Sales Return | `/sale_return` (`Salesreturn.tsx`) | `POST /sale/getSaleReturnItems`, `addSaleReturnCart`, `ReturnStockCreditNoteSubmit`, `createDirectCreditNote` | `DONE` | `sale-return.tsx` |
| Multi Recharge (Sale, Purchase, History, Operators, Target Summary) | `/multi_recharge`, `/operator`, `/multi_recharge_target_summary` | `GET /sale/getMultiRechargeProductDetails`, `getOperaterList`, `POST /sale/addMultiRecharge*`, `GET /sale/getMultiRechargeTargetSummary` | `DONE` | `MultiRechargeScreen.tsx` + `multi_recharge.tsx` |
| Payout Invoice (Turbo Bills) | `/payout_invoice` (`Payout.tsx`) | `POST /sale/getTurboInvoiceList`, `addPayout`, `acceptTurboInvoice`, `updateTurboInvoice`, `PATCH /sale/deleteTurboInvoice` | `DONE` | `PayoutInvoiceScreen.tsx` + `payout_invoice.tsx` |
| E-Way Bill (Invoices, Generate, History, Errors, Profile) | `/ewaybill`, `/ewaybillGeneration`, `/eway-history`, `/eway-error-list`, `/eway-profile` | `POST /sale/getEwayBill`, `getEwayBillHistory`, `PUT /sale/ewayBillGenerate`, `PATCH /sale/uploadPandingEwayHistory`, `GET /sale/getEwayErrorList`, `getEwayClientProfileDetail` | `DONE` | `EwayScreen.tsx` + `ewaybill.tsx` |
| E-Invoice (Bills, Generate, History, Upload, Errors, Profile) | `/e-invoice`, `/einvoice-history`, `/einvoice-error-list`, `/einvoice-profile` | `POST /sale/getEinvoiceBills`, `generateEinvoice`, `toggleEinvoiceHold`, `getEinvoiceHistory`, `uploadEinvoiceJsonToPortal`, `generateEinvoiceCreditNote`, `GET /sale/getEinvoiceErrorList` | `DONE` | `EinvoiceScreen.tsx` + `einvoice.tsx` |

---

## 7. DSR (Daily Sales & Stock Reports)

| Feature | Web Route / Page | Backend Endpoint(s) | Mobile Status | Notes / Action |
|---|---|---|---|---|
| Collection DSR + Day Open / Day End | `/collection_dsr` (`CollectionDsr.tsx`) | `POST /stock_dsr/getCollectionDsr`, `day_open_dsr`, `day_end_dsr` | `DONE` | `CollectionDsrScreen.tsx` + `collection_dsr.tsx` |
| Stock DSR + Day Open / Day End | `/stockdsr` (`stockdsr.tsx`) | `GET /stock_dsr/get_dsr_report`, `POST /stock_dsr/day_open_dsr`, `day_end_dsr` | `DONE` | `StockDsrScreen.tsx` + `stockdsr.tsx` |
| FSE Mobile App Mode (FOS) | FSE App | `POST /fse/DSR/submit`, `POST /fse/sale/generateSaleInvoice`, `GET /fse/get-user-stock`, etc. | `DONE` | `fse.tsx` DSR submit reports real errors on failure |

---

## 8. Reports & Exports (Sale, Stock, Retailer, Purchase, Cash/Bank, Financial, Credit, Misc)

| Feature | Web Route / Page | Backend Endpoint(s) | Mobile Status | Notes / Action |
|---|---|---|---|---|
| Reports Hub & Real Exports (CSV/PDF/Share) | `/reports` (`Reports.tsx`) | All `/sales/*`, `/stocks/*`, `/retailer/*`, `/purchase/*`, `/cash/*`, `/financials/*`, `/credits/*`, `/miscellaneous/*` | `DONE` | `GenericReportViewerScreen.tsx` & `SalesRegisterScreen.tsx` export full CSV rows + TOTAL row via `Share.share` |
| Report Routing & All Report IDs | `GenericReportViewerScreen.tsx` & `src/api/reports.ts` | `/retailer/getRetailerReturnable`, `/purchase/getPurchaseCancelDetail`, `getPurchaseReceiptRegister`, `getPurchaseLedgerSummary`, `getPurchaseTdsRegister`, `getPurchaseAdvancePayment`, `/stocks/getExecutiveStockDetail`, `/sale-attendance/getRetailerAttendance`, `/gst-register/report`, `/trading-pl/account`, etc. | `DONE` | Fixed `includes()` collisions + added all 8 missing report IDs (`bulk_upload`, `gst_summary_report`, `profit_loss_report`, `exec_outstanding_report`, `exec_attendance`, `shift_master`, `leave_history`, `material_transfer`) |
