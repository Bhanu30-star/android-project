<?php
include("../../connect.php");
$response = array();
if (isset($_POST['name']) && isset($_POST['phone']) && isset($_POST['distributor_id']) && isset($_POST['email']) && isset($_POST['gst_no']) && isset($_POST['adddress'])) {
	$ver = $_POST['distributor_id'];
	$name = mysqli_real_escape_string($con, $_POST['name']);
	$phone = $_POST['phone'];
	$email = $_POST['email'];
	$gst_no = $_POST['gst_no'];
	$address = mysqli_real_escape_string($con, $_POST['adddress']);
	$psupply = $_POST['psupply'];
	$dln_no = isset($_POST['dln_no']) ? $_POST['dln_no'] : '';
	$party_outstanding = isset($_POST['party_outstanding']) ? $_POST['party_outstanding'] : '0';
	$state_code = isset($_POST['state_code']) ? $_POST['state_code'] : '';
	$credit_amt_type = isset($_POST['outstanding_type']) ? $_POST['outstanding_type'] : 'To Pay';
	$phn = strrev(substr($phone, -3));
	$nm = trim(strtoupper(mb_substr($name, 0, 3)));
	$code = 'BT' . $nm . $phn;
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con, "SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if (mysqli_num_rows($disSql) > 0) {
		$disRow = mysqli_fetch_array($disSql);
		if ($disRow['country'] == 'United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate  = date("Y-m-d") . " " . date('H:i:sa');
	$billdate1 = date("Y-m-d");
	$scri = date('H:i:sa');
	$res1 = mysqli_query($con, "SELECT party_phone FROM tbl_purchase_party where party_name='$name' and distributor_id='$ver'");
	if (mysqli_num_rows($res1) <= 0) {
		if ($credit_amt_type == 'To Pay' && $party_outstanding > 0) {
			$query = mysqli_query($con, "INSERT INTO `tbl_purchase_party`(`bt_party_id`, `gstin_no`, `party_name`, `party_email`, `party_phone`, `party_address`, `insert_datetime`, `distributor_id`,`place_of_supply`,`DLN_no`,`outstanding_amount`,`state_code`) VALUES ('$code','$gst_no','$name','$email','$phone','$address','$cdate','$ver','$psupply','$dln_no','$party_outstanding','$state_code')");
			$pp_id1 = mysqli_insert_id($con);
			include("sale-purchase-balance-effect-class.php");
			$CashCollection = new Collectionbalance();
			$collections = $CashCollection->purchasecollection($ver, $party_outstanding, $billdate1, $pp_id1);
		} else if ($credit_amt_type == 'To Received' && $party_outstanding > 0) {
			$query = mysqli_query($con, "INSERT INTO `tbl_purchase_party`(`bt_party_id`, `gstin_no`, `party_name`, `party_email`, `party_phone`, `party_address`, `insert_datetime`, `distributor_id`,`place_of_supply`,`DLN_no`,`outstanding_amount`,`state_code`) VALUES ('$code','$gst_no','$name','$email','$phone','$address','$cdate','$ver','$psupply','$dln_no','0','$state_code')");
			$pp_id1 = mysqli_insert_id($con);
			$uniqueId = uniqid();
			$uniqueId1 = "DN" . strtoupper($uniqueId);
			$query_advance = mysqli_query($con, "INSERT IGNORE INTO `tbl_party_debit_note` (`distributor_id`, `purchase_party_id`, `bill_no`,`total_amount`, `final_net_amt`,`bill_date`, `bill_time`, `transaction_date`, `transaction_time`, `unique_bill`, `debit_note_type`, `remark`, `debitnote_billtype`) VALUES ('$ver','$pp_id1','000','$party_outstanding','$party_outstanding','$billdate1','$scri','$billdate1','$scri','$uniqueId1','Direct','','Inclusive')");
			include("sale-purchase-balance-effect-class.php");
			$CashCollection = new Collectionbalance();
			$collections = $CashCollection->purchaseminuscollection($ver, $party_outstanding, $billdate1, $pp_id1);
		} else {
			$query = mysqli_query($con, "INSERT IGNORE INTO `tbl_purchase_party`(`bt_party_id`, `gstin_no`, `party_name`, `party_email`, `party_phone`, `party_address`, `insert_datetime`, `distributor_id`,`place_of_supply`,`DLN_no`,`outstanding_amount`,`state_code`) VALUES ('$code','$gst_no','$name','$email','$phone','$address','$cdate','$ver','$psupply','$dln_no','0','$state_code')");
		}

		include("../../connect.php");

		$res2 = mysqli_query($con, "SELECT business_type FROM  tbl_distributor where business_type!='' and distributor_id='$ver'");
		if (mysqli_num_rows($res2) == 0) {
			$uq1 = mysqli_query($con, "UPDATE tbl_distributor SET business_type='Purchase',type_change_datetime='$cdate'  where distributor_id='$ver'");
		}
		$response['success'] = '1';
		$response['message'] = "Purchase Party Created!!";
	} else {
		$response['success'] = '0';
		$response['message'] = "Party already exists!!";
	}
} else {
	$response['success'] = '0';
	$response['message'] = "Error in Purchase Party Creation. Required field missing!!";
}
echo json_encode($response);
