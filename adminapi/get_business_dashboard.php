<?php
include("../../connect.php");
$response = array();
if (isset($_POST['distributor_user_id']) && isset($_POST['distributor_id'])) {
	$dis_uid = $_POST['distributor_user_id'];
	$dis_id = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con, "SELECT country FROM tbl_distributor WHERE distributor_id='$dis_id'");
	if (mysqli_num_rows($disSql) > 0) {
		$disRow = mysqli_fetch_array($disSql);
		if ($disRow['country'] == 'United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("h:i:s");
	$da  = date("Y-m-d");

	$startDate = $_POST['start_date'];
	$endDate = $_POST['end_date'];

	if($startDate == '' && $endDate == ''){
		$startDate = $da;
		$endDate = $da;
	}

	$select_user = mysqli_query($con, "SELECT imei_no,session_id FROM tbl_distributor_users where status='Active' and distributor_user_id='$dis_uid'");
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
	
	$select_user_request_count = mysqli_query($con, "SELECT * FROM tbl_user_request where status='Complete' and transaction_date BETWEEN '$startDate' AND '$endDate' and user_id in (select user_id FROM tbl_user where status='Active' and distributor_id='$dis_id')");
	$response['stock_approved_count']=mysqli_num_rows($select_user_request_count);
	

	$total_outstanding_receive_amt = 0;
	$res = mysqli_query($con, "SELECT *,sum(tbl_party_transaction.final_amt) as party_total_amt,sum(tbl_party_transaction.cash_amount) as party_received_amt FROM tbl_party_transaction,tbl_party where tbl_party_transaction.transaction_to=tbl_party.party_id and  tbl_party_transaction.payment_status!='Complete' and tbl_party_transaction.payment_mode='Credit' and tbl_party.distributor_id='$dis_id'");
	if (mysqli_num_rows($res) > 0) {
		$fetch_operator = mysqli_fetch_array($res);
		$response['total_outstanding_receive_amt'] = $fetch_operator['party_total_amt'] - $fetch_operator['party_received_amt'];
	} else {
		$response['total_outstanding_receive_amt'] = $total_outstanding_receive_amt;
	}


	$total_outstanding_payable_amt = 0;
	$res_purchase = mysqli_query($con, "SELECT sum(final_net_amt) as bill_final_amt, sum(pay_amount) as paid_amt,bill_no,unique_bill,bill_date FROM tbl_distributor_transaction where payment_status!= 'Complete' and payment_mode='Credit' and distributor_id='$dis_id' group by bill_no, unique_bill order by bill_date asc");
	if (mysqli_num_rows($res_purchase) > 0) {
		while ($fetch_product2 = mysqli_fetch_assoc($res_purchase)) {
			$res_detail = mysqli_query($con, "SELECT disc_amt,tcs_amt,labour_charges,freight_charges, other_expenses from tbl_distributor_transaction_charges where distributor_id='$dis_id' and bill_date='" . $fetch_product2['bill_date'] . "' AND bill_no='" . $fetch_product2['bill_no'] . "' and unique_bill='" . $fetch_product2['unique_bill'] . "'");
			$fetch_data = mysqli_fetch_assoc($res_detail);

		
			
			$total_outstanding_payable_amt = $total_outstanding_payable_amt + round(
    (($fetch_product2['bill_final_amt'] ?? 0)
    - ($fetch_data['disc_amt'] ?? 0)
    + ($fetch_data['tcs_amt'] ?? 0)
    + ($fetch_data['labour_charges'] ?? 0)
    + ($fetch_data['freight_charges'] ?? 0)
    + ($fetch_data['other_expenses'] ?? 0)
    - ($fetch_product2['paid_amt'] ?? 0)),
2);
			
		}
	}
	$response['total_outstanding_payable_amt'] = $total_outstanding_payable_amt;


	$closing = mysqli_query($con, "SELECT closing_amt,date,time FROM tbl_distributor_cash_collection WHERE distributor_id='$dis_id' AND date BETWEEN '$startDate' AND '$endDate' order by date desc limit 1");
	$fetch_closing = mysqli_fetch_array($closing);
	if (mysqli_num_rows($closing) > 0) {
		$response['cash_in_hand'] = $fetch_closing['closing_amt'];
		$response['cash_in_hand_date'] = $fetch_closing['date'];
		$response['cash_in_hand_time'] = $fetch_closing['time'];
	} else {
		$response['cash_in_hand'] = 0;
		$response['cash_in_hand_date'] = '';
		$response['cash_in_hand_time'] = '';
	}
	$final_bank_closing_amt = 0;

	$select_bank_data = mysqli_query($con, "SELECT * FROM `tbl_distributor_bank_master` WHERE distributor_id = '$dis_id' AND status = 'Active'");

	if (mysqli_num_rows($select_bank_data) > 0) {
		$bank_detail = array();
		while ($fetch_bank = mysqli_fetch_assoc($select_bank_data)) {
			$tamt_closing = 0;
			$tamt_date = $tamt_time = '';
			$bank_master_id = $fetch_bank['bank_master_id'];
			$bank_detail['bank_name'] = $fetch_bank['bank_name'];
			$product_detail = mysqli_query($con, "SELECT * FROM tbl_distributor_bank_collection WHERE date BETWEEN '$startDate' AND '$endDate' AND distributor_id = '$dis_id' AND bank_id = '$bank_master_id' OREDR BY date DESC limit 1");
			if (mysqli_num_rows($product_detail) > 0) {
				$fetch_detail = mysqli_fetch_array($product_detail);
				$tamt_closing = $fetch_detail['closing_amt'];
				$tamt_date = $fetch_detail['date'];
				$tamt_time = $fetch_detail['time'];
			}
			$final_bank_closing_amt = $final_bank_closing_amt + $tamt_closing;
			$bank_detail['closing_amt'] = $tamt_closing;
			$bank_detail['closing_date'] = $tamt_date;
			$bank_detail['closing_time'] = $tamt_time;
			$response['bank_detail'][] = $bank_detail;
		}
	}
	$response['final_bank_at_hand'] = $final_bank_closing_amt;

	$expense_month  = date("Y-m-01");
	$select_expense_amt = mysqli_query($con, "SELECT sum(final_amount) AS final_expense_amt FROM `tbl_distributor_expenses_master` WHERE insert_date BETWEEN '$startDate' AND '$endDate' AND distributor_id = '$dis_id' AND status = 'Complete'");
	if (mysqli_num_rows($select_expense_amt) > 0) {
		$fetch_closing = mysqli_fetch_array($select_expense_amt);
		if ($fetch_closing['final_expense_amt'] > 0)
			$response['expense_amt_till_date'] = $fetch_closing['final_expense_amt'];
		else
			$response['expense_amt_till_date'] = 0;
	} else {
		$response['expense_amt_till_date'] = 0;
	}

	// today sale
	$getSale = mysqli_query($con, "SELECT sum(final_amt) AS final_amt FROM `vwSalesSummary` WHERE transaction_date BETWEEN '$startDate' AND '$endDate' AND distributor_id = '$dis_id' AND bill_type IN ('Tax Invoice','Payout','Delivery Challan')");
	if (mysqli_num_rows($getSale) != 0) {
		foreach ($getSale as $fetchSale) {
			$totalSaleToday += $fetchSale['final_amt'];
		}
		$response['totalSale'] = $totalSaleToday;
	}else{
		$response['totalSale'] = 0;
	}

	// today purchase
	$getPurchase = mysqli_query($con, "SELECT tbl_distributor_transaction.final_net_amt, tbl_distributor_transaction.transaction_id FROM tbl_distributor_transaction, tbl_product WHERE tbl_distributor_transaction.product_id = tbl_product.product_id AND tbl_distributor_transaction.distributor_id = '$dis_id' AND tbl_distributor_transaction.bill_date BETWEEN '$startDate' AND '$endDate' AND tbl_distributor_transaction.txn_type = 'Add' AND tbl_distributor_transaction.conversion = '' AND tbl_product.product_name NOT IN ('Airtel Money','Idea Money','Jio Phone') ORDER BY tbl_distributor_transaction.id ASC");
	if (mysqli_num_rows($getPurchase) != 0) {

		foreach($getPurchase as $fetchPurchase){
			$totalPurchaseToday += round($fetchPurchase['final_net_amt'], 2);
			$temp_txn_id = $fetchPurchase['transaction_id'];

			$product_return = mysqli_query($con, "SELECT * FROM `tbl_purchase_return_transaction` WHERE `transaction_id` = '$temp_txn_id'");
			foreach($product_return as $pro_fetch_return){
				$totalPurchaseToday -= round($pro_fetch_return['return_net_amt'], 2);
			}
		}
		$response['totalPurchase'] = $totalPurchaseToday;
	}else{
		$response['totalPurchase'] = 0;
	}

	// total bills
	$getTotalBill = mysqli_query($con, "SELECT count(bill_number) AS bill_count FROM `tblSalesSummary` WHERE transaction_date BETWEEN '$startDate' AND '$endDate' AND distributor_id = '$dis_id' AND bill_type IN ('Tax Invoice','Payout','Delivery Challan')");
	if (mysqli_num_rows($getTotalBill) != 0) {
		$fetchTotalBill = mysqli_fetch_assoc($getTotalBill);
		$totalMonthSaleBills = $fetchTotalBill['bill_count'];
		$response['invoice'] = $totalMonthSaleBills;
	}else{
		$response['invoice'] = 0;
	}

	// credit bills
	$getSaleBills = mysqli_query($con, "SELECT bill_number FROM `tblSalesSummary` WHERE transaction_date BETWEEN '$startDate' AND '$endDate' AND distributor_id = '$dis_id' AND bill_type IN ('Tax Invoice','Payout','Delivery Challan') AND payment_mode = 'Credit'");
	if (mysqli_num_rows($getSaleBills) > 0) {
		$totalSaleBillCredit = mysqli_num_rows($getSaleBills);
		$response['creditInvoice'] = $totalSaleBillCredit;
	}else{
		$response['creditInvoice'] = 0;
	}

	$response['success'] = '1';
	$response['message'] = "Fetch Detail Successful";
} else {
	$response['success'] = '0';
	$response['details'] = "Error in Logging in, Please update App from Google Play Store and Login!!";
}
echo json_encode($response);
