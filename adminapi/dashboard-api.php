<?php
error_reporting(0);
date_default_timezone_set('Asia/Calcutta');
$currentTime = date("h:i:s");
$currentDate  = date("Y-m-d");

include("../../connect.php");

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if (strpos($contentType, 'application/json') !== false) {
    $rawData = file_get_contents("php://input");

    $post = json_decode($rawData, true);

    if ($post === null) {
        echo json_encode(["error" => "Invalid JSON received"]);
        exit;
    }
} elseif (strpos($contentType, 'application/x-www-form-urlencoded') !== false) {
    $post = $_POST;
} else {
    $post = $_POST;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($post['type']) && $post['type'] === 'businessDashboard') {

    try {

        $client_user_id = isset($post['client_user_id']) ? trim($post['client_user_id']) : '';
        $client_id      = isset($post['client_id']) ? trim($post['client_id']) : '';
        $startDate      = isset($post['startDate']) ? trim($post['startDate']) : '';
        $endDate        = isset($post['endDate']) ? trim($post['endDate']) : '';

        if (
            $client_user_id === '' ||
            $client_id === '' ||
            $startDate === '' ||
            $endDate === ''
        ) {
            echo json_encode([
                'status'  => false,
                'message' => 'All fields are required'
            ]);
            exit;
        }

        $serSerial = 'No';
        $totalSaleToday = 0;
        $totalFSE = 0;
        $expenseAmt = 0;
        $totalPurchaseToday = 0;
        $totalMonthSaleBills = 0;
        $totalSaleBillCredit = 0;
        $totalOutstandingSale = 0;
        $final_stock_value = 0;
        $final_pending_value = 0;
        $final_pendingpay_value = 0;
        $cashCollected = 0;
        $bankCollected = 0;

        $checkCountry = mysqli_query($con, "SELECT country FROM `tbl_distributor` WHERE distributor_id = '$client_id'");

        if (mysqli_num_rows($checkCountry) > 0) {
            $getCountry = mysqli_fetch_array($checkCountry);
            if ($getCountry['country'] == 'United Arab Emirates') {
                date_default_timezone_set('Asia/Dubai');
            }
        }

        $select_user = mysqli_query($con, "SELECT imei_no,session_id FROM `tbl_distributor_users` WHERE status = 'Active' AND distributor_user_id = '$client_user_id'");
        if (mysqli_num_rows($select_user) > 0) {
            while ($fetch_user = mysqli_fetch_array($select_user)) {
                $response['user_status'] = '1';
                $response['user_imei'] = $fetch_user['imei_no'];
                $response['session_id'] = $fetch_user['session_id'];
            }
        } else {
            $response['user_status'] = '0';
            $response['session_id'] = '';
            $response['user_imei'] = '';
        }

        // purchase
        $getPurchase = mysqli_query($con, "SELECT tbl_distributor_transaction.final_net_amt, tbl_distributor_transaction.transaction_id FROM tbl_distributor_transaction, tbl_product WHERE tbl_distributor_transaction.product_id = tbl_product.product_id AND tbl_distributor_transaction.distributor_id = '$client_id' AND tbl_distributor_transaction.bill_date BETWEEN '$startDate' AND '$endDate' AND tbl_distributor_transaction.txn_type = 'Add' AND tbl_distributor_transaction.conversion = '' AND tbl_product.product_name NOT IN ('Airtel Money','Idea Money','Jio Phone') ORDER BY tbl_distributor_transaction.id ASC");
        if (mysqli_num_rows($getPurchase) != 0) {

            foreach ($getPurchase as $fetchPurchase) {
                $totalPurchaseToday += round($fetchPurchase['final_net_amt'], 2);
                $temp_txn_id = $fetchPurchase['transaction_id'];

                $product_return = mysqli_query($con, "SELECT * FROM `tbl_purchase_return_transaction` WHERE `transaction_id` = '$temp_txn_id'");
                foreach ($product_return as $pro_fetch_return) {
                    $totalPurchaseToday -= round($pro_fetch_return['return_net_amt'], 2);
                }
            }
        }

        // invoices
        $getTotalBill = mysqli_query($con, "SELECT COUNT(*) AS bill_count,sum(final_amt) as total_Final_saleamt FROM tbl_party_transaction WHERE transaction_date BETWEEN '$startDate' AND '$endDate' AND transaction_from IN (SELECT user_id FROM tbl_user WHERE distributor_id = '$client_id')");
        if (mysqli_num_rows($getTotalBill) != 0) {
            $fetchTotalBill = mysqli_fetch_assoc($getTotalBill);
            $totalMonthSaleBills = $fetchTotalBill['bill_count'];
			$totalSaleToday += $fetchTotalBill['total_Final_saleamt'];
        }

        // credit invoices
        if($endDate == date('Y-m-d')){
            $getTotalBillCredit = mysqli_query($con, "SELECT COUNT(*) AS bill_count FROM tbl_party_transaction WHERE transaction_date = '$currentDate' AND payment_mode = 'Credit' AND transaction_from IN (SELECT user_id FROM tbl_user WHERE distributor_id = '$client_id')");
            if (mysqli_num_rows($getTotalBillCredit) != 0) {
                $fetchTotalBillCredit = mysqli_fetch_assoc($getTotalBillCredit);
                $totalMonthSaleBillsCredit = $fetchTotalBillCredit['bill_count'];
            }
        }

        $getSaleBills = mysqli_query($con, "SELECT bill_number FROM `tblSalesSummary` WHERE transaction_date BETWEEN '$startDate' AND '$endDate' AND distributor_id = '$client_id' AND bill_type IN ('Tax Invoice','Payout','Delivery Challan') AND payment_mode = 'Credit'");
        if (mysqli_num_rows($getSaleBills) > 0) {
            $totalSaleBillCredit = mysqli_num_rows($getSaleBills);
        }

        $totalSaleBillCredit += $totalMonthSaleBillsCredit;

        // total fse
        $getFSE = mysqli_query($con, "SELECT user_id FROM `tbl_user` WHERE distributor_id = '$client_id' AND status = 'Active'");
        if (mysqli_num_rows($getFSE) > 0) {
            $totalFSE = mysqli_num_rows($getFSE);
        }

        // pending stock request
        $getPendingStockReq = mysqli_query($con, "SELECT * FROM `tbl_user_request` WHERE status = 'Pending' AND user_id IN (SELECT user_id FROM `tbl_user` WHERE distributor_id = '$client_id')");
        $fetchPendingStockReq = mysqli_num_rows($getPendingStockReq);

        // fos day end
        $getSalesExecutive = mysqli_query($con, "SELECT tbl_dsr.dsr_id FROM `tbl_dsr`,`tbl_user` WHERE tbl_dsr.user_id = tbl_user.user_id AND tbl_user.distributor_id = '$client_id' AND tbl_dsr.dsr_status IN ('Pending')");
        $fetchSalesExecutive  = mysqli_num_rows($getSalesExecutive);

        // fos day end submitted
        $getdsrSubmit = mysqli_query($con, "SELECT tbl_dsr.dsr_id FROM `tbl_dsr`,`tbl_user` WHERE tbl_dsr.user_id = tbl_user.user_id AND tbl_user.distributor_id = '10347' AND tb_insertdate = '$currentDate' AND tbl_dsr.dsr_status IN ('Accept');");
        $fetchdsrSubmit  = mysqli_num_rows($getdsrSubmit);

        // expense amount
        $getExpense = mysqli_query($con, "SELECT *, SUM(final_amount) AS expense_amt FROM `tbl_distributor_expenses_master` WHERE distributor_id = '$client_id' AND date BETWEEN '$startDate' AND '$endDate'");
        if (mysqli_num_rows($getExpense) != 0) {
            $fetchExpense = mysqli_fetch_assoc($getExpense);
            $expenseAmt = $fetchExpense['expense_amt'];
        } else {
            $expenseAmt = 0;
        }

        // stock approved
        $getStockApproved = mysqli_query($con, "SELECT * FROM `tbl_user_request`,`tbl_user` WHERE tbl_user_request.user_id = tbl_user.user_id AND tbl_user_request.status = 'Complete' AND tbl_user_request.complete_date BETWEEN '$startDate' AND '$endDate' AND tbl_user.distributor_id = '$client_id'");
        $fetchStockApproved  = mysqli_num_rows($getStockApproved);

        // outstanding collect
        $saleCollect = mysqli_query($con, "SELECT *, sum(tbl_party_transaction.final_amt) AS party_total_amt, sum(tbl_party_transaction.cash_amount) AS party_received_amt FROM `tbl_party_transaction`,`tbl_user`,`tbl_party` WHERE tbl_party_transaction.transaction_from = tbl_user.user_id AND tbl_party_transaction.transaction_to = tbl_party.party_id AND tbl_user.distributor_id = '$client_id' AND tbl_party_transaction.payment_mode = 'Credit' AND tbl_party_transaction.payment_status IN ('Partial Completed','Pending')");

        if (mysqli_num_rows($saleCollect) > 0) {
            while ($fetch_product = mysqli_fetch_assoc($saleCollect)) {

                $party_total_amt    = (float)$fetch_product['party_total_amt'];
                $party_received_amt = (float)$fetch_product['party_received_amt'];
                $pending = $party_total_amt - $party_received_amt;
                $final_pending_value += round($pending, 2);
            }
        }

        $partyCollect = mysqli_query($con, "SELECT * FROM `tbl_party` WHERE distributor_id = '$client_id' AND outstanding_amount > 0 AND outstanding_amount != adjusted_outstanding_amt");
        if (mysqli_num_rows($partyCollect) > 0) {
            while ($fetch_data = mysqli_fetch_assoc($partyCollect)) {
                $outstanding = (float)$fetch_data['outstanding_amount'];
                $adjusted    = (float)$fetch_data['adjusted_outstanding_amt'];
                $pending = $outstanding - $adjusted;
                $final_pending_value += round($pending, 2);
            }
        }

        // total bank collect
        $bank_masteCollect = mysqli_query($con, "SELECT bank_master_id FROM `tbl_distributor_bank_master` WHERE distributor_id = '$client_id' AND status='Active'");
        while ($fetch_bank = mysqli_fetch_assoc($bank_masteCollect)) {
            $bankid = $fetch_bank['bank_master_id'];
            $getBankCollection = mysqli_query($con, "SELECT closing_amt FROM `tbl_distributor_bank_collection` WHERE distributor_id = '$client_id' and bank_id='$bankid' ORDER BY date DESC LIMIT 1");
            if (mysqli_num_rows($getBankCollection) != 0) {
                $fetchBankCollection = mysqli_fetch_assoc($getBankCollection);
                $closingAmt = $closingAmt + $fetchBankCollection['closing_amt'];
            }
        }

        // total cash collect
        $getCashCollection = mysqli_query($con, "SELECT closing_amt FROM `tbl_distributor_cash_collection` WHERE distributor_id = '$client_id' ORDER BY date DESC LIMIT 1");
        if (mysqli_num_rows($getCashCollection) != 0) {
            $fetchCashCollection = mysqli_fetch_assoc($getCashCollection);
            $closingCashAmt = $fetchCashCollection['closing_amt'];
        } else {
            $closingCashAmt = 0;
        }
        $closingCashAmt = $closingCashAmt < 0 ? 0 : $closingCashAmt;



        // outstanding pay
        $puchaseCollect = mysqli_query($con, "SELECT unique_bill,bill_no,final_net_amt FROM `tbl_distributor_transaction` WHERE distributor_id = '$client_id' AND payment_mode = 'Credit' AND payment_status!='Complete'");
        if (mysqli_num_rows($puchaseCollect) > 0) {
            while ($fetch_data12 = mysqli_fetch_assoc($puchaseCollect)) {
                $res_paidamt = mysqli_query($con, "select sum(total_amount) as paid_amt from tbl_purchase_payment_transaction WHERE unique_bill='$fetch_data12[unique_bill]' AND bill_no='$fetch_data12[bill_no]'");
                $fetch_paid = mysqli_fetch_assoc($res_paidamt);
                $party_received_amt = (float)$fetch_paid['paid_amt'];
                $res_charges = mysqli_query($con, "select net_amt from tbl_distributor_transaction_charges WHERE unique_bill='$fetch_data12[unique_bill]' AND bill_no='$fetch_data12[bill_no]' limit 1");
                $fetch_charges = mysqli_fetch_assoc($res_charges);

                if (mysqli_num_rows($res_charges) == 0)
                    $party_total_amt    = (float)$fetch_data12['final_net_amt'];
                else
                    $party_total_amt    = (float)$fetch_charges['net_amt'];
                $pendingpay = $party_total_amt - $party_received_amt;
                $final_pendingpay_value += round($pendingpay, 2);
            }
        }

        $res_1 = mysqli_query($con, "SELECT net_round_amount ,paid_amount FROM tbl_ecommerce_purchase_master where payment_status!='Paid' and payment_mode='Credit' and distributor_id='$client_id' and status='Active'");
        if (mysqli_num_rows($res_1) > 0) {
            while ($fetch_product2 = mysqli_fetch_assoc($res_1)) {
                $check_payment = $fetch_product2['net_round_amount'] - $fetch_product2['paid_amount'];
                $final_pendingpay_value += round($check_payment, 2);
            }
        }

        $partyCollectpay = mysqli_query($con, "SELECT * FROM `tbl_purchase_party` WHERE distributor_id = '$client_id' AND outstanding_amount > 0 AND outstanding_amount != adjusted_outstanding_amt");
        if (mysqli_num_rows($partyCollectpay) > 0) {
            while ($fetch_data = mysqli_fetch_assoc($partyCollectpay)) {
                $outstandingpay = (float)$fetch_data['outstanding_amount'];
                $adjustedpay    = (float)$fetch_data['adjusted_outstanding_amt'];
                $pendingpay = $outstandingpay - $adjustedpay;
                $final_pendingpay_value += round($pendingpay, 2);
            }
        }


        // total cash collection betwwen duration 
		$saleCollect_cash = mysqli_query($con, "SELECT SUM(
        CASE 
            WHEN payment_mode='Cash' THEN final_amt
            ELSE cash_amount
        END
		) AS total_cash FROM `tbl_party_transaction`,`tbl_user` WHERE tbl_party_transaction.transaction_from = tbl_user.user_id AND tbl_user.distributor_id = '$client_id' AND tbl_party_transaction.payment_mode in ('Cash','Both') AND tbl_party_transaction.payment_status='Complete' and transaction_date BETWEEN '$startDate' AND '$endDate' and tbl_party_transaction.source in ('Admin','Web')");
		$cashCollected = 0;
        $row1 = mysqli_fetch_assoc($saleCollect_cash);
		$cashCollected = (float)$row1['total_cash'];
		
		$cash_bank = mysqli_query($con, "SELECT SUM(withdrawal_amt) AS total_withdraw FROM tbl_distributor_bank_transfer where insert_date>='$startDate' and insert_date<='$endDate' and distributor_id='$client_id' and status='Complete' and bank_contra_id='0' and txn_type='Withdrawal'");
		$row2 = mysqli_fetch_assoc($cash_bank);
		$cashCollected += (float)$row2['total_withdraw'];
		
		$dsr_detail = mysqli_query($con, "select SUM(tbl_dsr.cash_detail) AS total_dsr_cash from tbl_dsr,tbl_user where tbl_dsr.user_id = tbl_user.user_id and tbl_dsr.dsr_status= 'Accept' and tbl_dsr.tb_insertdate >='$startDate' and tbl_dsr.tb_insertdate <='$endDate' and tbl_user.distributor_id='$client_id'");
		$row3 = mysqli_fetch_assoc($dsr_detail);
		$cashCollected += (float)$row3['total_dsr_cash'];
		
		$res_receipt = mysqli_query($con, "SELECT SUM(cash_amount) AS total_receipt_cash FROM tbl_receipt_transaction where receipt_date>='$startDate' and receipt_date<='$endDate' and generated_user_id='$client_id' and payment_mode in ('Cash','Both') and source in ('Web','Admin')");
		$row4 = mysqli_fetch_assoc($res_receipt);
		$cashCollected += (float)$row4['total_receipt_cash'];

		
		$res_otherreceipt = mysqli_query($con, "SELECT SUM(cash_amount) AS total_other_cash FROM tbl_other_receipt_txn,tbl_party where tbl_other_receipt_txn.party_id=tbl_party.party_id and tbl_other_receipt_txn.receipt_date>='$startDate' and tbl_other_receipt_txn.receipt_date<='$endDate' and tbl_party.distributor_id='$client_id' and tbl_other_receipt_txn.status='Complete' and tbl_other_receipt_txn.source in ('Web','Admin') and tbl_other_receipt_txn.payment_mode in ('Cash','Both')");
		$row6 = mysqli_fetch_assoc($res_otherreceipt);
		$cashCollected += (float)$row6['total_other_cash'];
		
		$cash_other_1 = mysqli_query($con, "SELECT SUM(txn_amount) AS other_cash FROM tbl_other_cash_txn_master where insert_date>='$startDate' and insert_date<='$endDate' and distributor_id='$client_id' and status='Complete' and txn_type!='To Receive'");
		$row5 = mysqli_fetch_assoc($cash_other_1);
		$cashCollected += (float)$row5['other_cash'];

		$cashCollectedfinal = $cashCollected < 0 ? 0 : $cashCollected;
		
		$bankIds = [];
		mysqli_data_seek($bank_masteCollect, 0);
        while ($fetch_bank = mysqli_fetch_assoc($bank_masteCollect)) 
		{
			 $bankIds[] = $fetch_bank['bank_master_id'];
		}
		$bankid = implode(',', $bankIds);

        // total bank collection betwwen duration 
		$bankCollected=0;
		
		if (!empty($bankid)) {
		
		$cash_bank=mysqli_query($con,"SELECT SUM(transfer_amt) AS bank_total FROM tbl_distributor_bank_transfer where insert_date>='$startDate' and insert_date<='$endDate' and distributor_id='$client_id' and status='Complete' and txn_type in ('Deposite','Cheque Deposite','Interest Received') and bank_id in ($bankid)");
		$row61 = mysqli_fetch_assoc($cash_bank);
		$bankCollected = (float)$row61['bank_total'];
		
		$sale_detail = mysqli_query($con,"select SUM(tbl_party_transaction.final_amt) as partyfinal_amt from tbl_party_transaction,tbl_party where tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_party_transaction.payment_status= 'Complete' and tbl_party_transaction.transaction_date>='$startDate' and tbl_party_transaction.transaction_date<='$endDate' and tbl_party.distributor_id='$client_id' and tbl_party_transaction.bill_type!='Receipt' and tbl_party_transaction.source in ('Admin','Web') and tbl_party_transaction.payment_mode in ('Online','Wallet') and tbl_party_transaction.payment_status!='Converted' and tbl_party_transaction.bank_id in ($bankid)");
		$row62 = mysqli_fetch_assoc($sale_detail);
		$bankCollected += (float)$row62['partyfinal_amt'];
		
		$res_receipt=mysqli_query($con,"SELECT SUM(total_amount) as final_receipt_amt FROM tbl_receipt_transaction where receipt_date>='$startDate' and receipt_date<='$endDate' and generated_user_id='$client_id' and source in ('Web','Admin') and payment_mode in ('Online','Wallet') AND bank_id in ($bankid)");
		$row63 = mysqli_fetch_assoc($res_receipt);
		$bankCollected += (float)$row63['final_receipt_amt'];
		
		$res_receipt_other=mysqli_query($con,"SELECT SUM(tbl_other_receipt_txn.cheque_amount) AS total_other_cheque FROM tbl_other_receipt_txn,tbl_party where tbl_other_receipt_txn.party_id=tbl_party.party_id and tbl_other_receipt_txn.receipt_date>='$startDate' and tbl_other_receipt_txn.receipt_date<='$endDate' and tbl_party.distributor_id='$client_id' and tbl_other_receipt_txn.status='Complete' and tbl_other_receipt_txn.source in ('Web','Admin') and  tbl_other_receipt_txn.bank_id in ($bankid)");
		$row64 = mysqli_fetch_assoc($res_receipt_other);
		$bankCollected += (float)$row64['total_other_cheque'];
		
		$cash_other_2=mysqli_query($con,"SELECT sum(tbl_other_cash_txn_master_detail.total_amount) as finalother_amt FROM tbl_other_cash_txn_master_detail,tbl_other_cash_txn_master where tbl_other_cash_txn_master_detail.transaction_id = tbl_other_cash_txn_master.transaction_id and tbl_other_cash_txn_master_detail.receipt_date>='$startDate' and tbl_other_cash_txn_master_detail.receipt_date<='$endDate' and tbl_other_cash_txn_master_detail.status ='Complete' and tbl_other_cash_txn_master_detail.bank_id in ($bankid) and  tbl_other_cash_txn_master.distributor_id='$client_id' and tbl_other_cash_txn_master.txn_type='To Receive'");
		$row65 = mysqli_fetch_assoc($cash_other_2);
		$bankCollected += (float)$row65['finalother_amt'];
		
		}
        $bankCollectedfinal = $bankCollected < 0 ? 0 : $bankCollected;

        $req_stockCount = mysqli_query($con, "SELECT tbl_user_request.transaction_id FROM tbl_user_request,tbl_user WHERE tbl_user_request.user_id=tbl_user.user_id AND tbl_user_request.status = 'Pending' and tbl_user.distributor_id = '$client_id'");
        $request_count = mysqli_num_rows($req_stockCount);


        // graph
        $today = date('Y-m-d');
        $yesterday = date('Y-m-d', strtotime("-1 days"));
        $effectiveStartDate = $startDate;
        $effectiveEndDate = $endDate;

        if ($startDate == $endDate) {
            if ($startDate == $today) {
                $effectiveStartDate = date('Y-m-d', strtotime($startDate . " - 1 days"));
            } elseif ($startDate == $yesterday) {
                $effectiveStartDate = date('Y-m-d', strtotime($startDate . " - 1 days"));
                $effectiveEndDate = $today;
            } else {
                $effectiveStartDate = date('Y-m-d', strtotime($startDate . " - 1 days"));
            }
        }

        $start_ts = strtotime($startDate);
        $end_ts = strtotime($endDate);
        $diff_days = round(($end_ts - $start_ts) / (60 * 60 * 24));

        $isMonthlyView = ($diff_days > 31);

        $groupBy = $isMonthlyView ? "DATE_FORMAT(transaction_date, '%Y-%m')" : "transaction_date";
        $groupByPurchase = $isMonthlyView ? "DATE_FORMAT(t.bill_date, '%Y-%m')" : "t.bill_date";

        // Fetch Sales
        $salesData = [];
        $graphSaleQuery = mysqli_query($con, "SELECT $groupBy AS label, SUM(final_amt) AS total FROM `vwSalesSummary` WHERE transaction_date BETWEEN '$effectiveStartDate' AND '$effectiveEndDate' AND distributor_id = '$client_id' AND bill_type IN ('Tax Invoice','Payout','Delivery Challan') GROUP BY label");
        while ($r = mysqli_fetch_assoc($graphSaleQuery)) {
            $salesData[$r['label']] = $r['total'];
        }

        // Fetch Purchase
        $purchaseData = [];
        $graphPurchaseQuery = mysqli_query($con, "SELECT $groupByPurchase AS label, SUM(t.final_net_amt - COALESCE(r.return_net_amt, 0)) AS total FROM tbl_distributor_transaction t JOIN tbl_product p ON t.product_id = p.product_id LEFT JOIN tbl_purchase_return_transaction r ON t.transaction_id = r.transaction_id WHERE t.distributor_id = '$client_id' AND t.bill_date BETWEEN '$effectiveStartDate' AND '$effectiveEndDate' AND t.txn_type = 'Add' AND t.conversion = '' AND p.product_name NOT IN ('Airtel Money','Idea Money','Jio Phone') GROUP BY label");
        while ($r = mysqli_fetch_assoc($graphPurchaseQuery)) {
            $purchaseData[$r['label']] = $r['total'];
        }

        $graphData = [];

        if ($isMonthlyView) {
            $current = strtotime(date('Y-m-01', $start_ts));
            $last_month_ts = strtotime(date('Y-m-01', $end_ts));

            while ($current <= $last_month_ts) {
                $monthKey = date('Y-m', $current);
                $monthName = date('M-y', $current);

                $graphData[] = [
                    "date" => $monthName,
                    "sale" => round($salesData[$monthKey] ?? 0),
                    "purchase" => round($purchaseData[$monthKey] ?? 0)
                ];
                $current = strtotime("+1 month", $current);
            }
        } else {
            $curr = strtotime($effectiveEndDate);
            $last = strtotime($effectiveStartDate);
            while ($curr >= $last) {
                $dateLabel = date('Y-m-d', $curr);
                $graphData[] = [
                    "date" => $dateLabel,
                    "sale" => round($salesData[$dateLabel] ?? 0),
                    "purchase" => round($purchaseData[$dateLabel] ?? 0)
                ];
                $curr = strtotime("-1 day", $curr);
            }
        }

        $dashboardArr[] = [

            'totalFSE'             => round($totalFSE ?? 0),
            'expenseAmt'           => round($expenseAmt ?? 0),
            'totalSale'            => round($totalSaleToday ?? 0),
            'totalPurchase'        => round($totalPurchaseToday ?? 0),
            'totalInvoice'         => round($totalMonthSaleBills ?? 0),
            'totalCreditInvoice'   => round($totalSaleBillCredit ?? 0),
            'pendingStockReq'      => round($fetchPendingStockReq ?? 0),
            'pendingDSR'           => round($fetchSalesExecutive ?? 0),
            'submittedDSR'         => round($fetchdsrSubmit ?? 0),
            'stockApproved'        => round($fetchStockApproved ?? 0),
            'cashCollected'        => round($cashCollectedfinal ?? 0),
            'bankCollected'        => round($bankCollectedfinal ?? 0),
            'outstandingCollected' => round($final_pending_value ?? 0),
            'outstandingPay'       => round($final_pendingpay_value ?? 0),
            'cashBalance'          => round($closingCashAmt ?? 0),
            'bankBalance'          => round($closingAmt ?? 0),
            'graphData'            => $graphData,
        ];

        http_response_code(200);
        echo json_encode(['status' => 'success', 'message' => 'Data Found', 'data' => $dashboardArr]);
    } catch (InvalidArgumentException $e) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'data' => null, 'message' => 'Invalid Argument Error: ' . $e->getMessage()]);
        exit();
    } catch (Exception $e) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'data' => null, 'message' => 'General Error: ' . $e->getMessage()]);
        exit();
    }
}
