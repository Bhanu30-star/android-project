<?php
$response = array();
include("../../connect.php");
if(isset($_POST['txn_id']) && isset($_POST['total_order']) && isset($_POST['round_off_amt']) && isset($_POST['payment_mode']) && isset($_POST['distributor_id']) && isset($_POST['disc_amt']) && isset($_POST['final_amt']) && isset($_POST['cash_amount']) &&isset($_POST['cheque_amount']))
{  
	date_default_timezone_set('Asia/Calcutta');
	$clientIP = $_SERVER['REMOTE_ADDR'];
	$apiUrl = "http://ipinfo.io/{$clientIP}/json";
	$response1 = file_get_contents($apiUrl);
	$details = json_decode($response1, true);
	if($details['country']=='AE')
	{
		date_default_timezone_set('Asia/Dubai');
	}

	$get_txn_id = $_POST['txn_id']; 
	$disc_amt = $_POST['disc_amt'];  
	$total_final_val = $_POST['final_amt']; 
	$total_amt = $_POST['total_amt']; 
	$round_off_amt = $_POST['round_off_amt']; 	
	$toder = $_POST['total_order'];
	$pmode = $_POST['payment_mode'];
	$dis_id = $_POST['distributor_id'];
	$bank_name = isset($_POST['bank_name']) ? $_POST['bank_name'] : '';
	$cheque_no = isset($_POST['cheque_no']) ? $_POST['cheque_no'] : '';
	$cheque_date = isset($_POST['cheque_date']) ? $_POST['cheque_date'] : '';
	$cash_amt=0;
	$cheque_amt=0;
	if($pmode=="Both")
	{
		$cash_amt=$_POST['cash_amount'];
		$cheque_amt=$_POST['cheque_amount'];
	}
	else if($pmode=="Cash")
	{
		$cash_amt=$total_final_val;
		$cheque_amt=0;
	}
	else
	{
		$cash_amt=0;
		$cheque_amt=$total_final_val;
	}
	$scro = date("H:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$uq_sequence11=mysqli_query($con,"UPDATE tbl_party_transaction SET final_amt='$total_final_val',cheque_amount='$cheque_amt',cash_amount='$cash_amt',bill_editable='Yes',bill_edit_datetime='$scri',disc_amt='$disc_amt',bank_name='$bank_name',cheque_no='$cheque_no',cheque_date='$cheque_date',total_amount='$total_amt' where transaction_id='$get_txn_id'");
	$json_a=json_decode($toder, true);     
	foreach ($json_a as $person_a)
	{
		$prodid=$person_a['pid'];
		$cgstamt = isset($person_a['cgst_amt']) ? $person_a['cgst_amt'] : '';
		$sgstamt = isset($person_a['sgst_amt']) ? $person_a['sgst_amt'] : '';
		$igstamt = isset($person_a['igstamt']) ? $person_a['igstamt'] : '';		
		$pro_discount = isset($person_a['pro_discount']) ? $person_a['pro_discount'] : '';
		$txn_id = $person_a['transaction_detail_id'];
		$pro_total_amt = isset($person_a['pro_total_amt']) ? $person_a['pro_total_amt'] : '';
		$pro_taxable_amt = $person_a['pro_taxable_amt'];
		
		$res_submit = mysqli_query($con,"select * from  tbl_party_transaction_detail where transaction_id='$get_txn_id' and transaction_detail_id='$txn_id'");
		while($fetch_product1=mysqli_fetch_assoc($res_submit))
		{
			$uq_update =mysqli_query($con,"INSERT INTO `tbl_party_transaction_detail_history`(`transaction_detail_id`, `transaction_id`, `product_id`, `product_name`, `product_price`, `quantity`, `IMEI_NO`, `product_disc`, `CGST_amount`, `SGST_amount`, `IGST_amount`,`insert_datetime`) VALUES ('".$fetch_product1['transaction_detail_id']."','$get_txn_id','".$fetch_product1['product_id']."','".$fetch_product1['product_name']."','".$fetch_product1['product_price']."','".$fetch_product1['quantity']."','".$fetch_product1['IMEI_NO']."','".$fetch_product1['product_disc']."','".$fetch_product1['CGST_amount']."','".$fetch_product1['SGST_amount']."','".$fetch_product1['IGST_amount']."','$scri')");
																							
			$uq_sequence=mysqli_query($con,"UPDATE tbl_party_transaction_detail SET product_disc='$pro_discount',CGST_amount='$cgstamt',SGST_amount='$sgstamt',IGST_amount='$igstamt',product_total_amt='$pro_total_amt',taxable_amount='$pro_taxable_amt' where transaction_detail_id='$txn_id' and transaction_id='$get_txn_id'");
		}
	}	
	// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$dis_id', 'INSERT+UPDATE OPERATION,Edit party bill#Admin(INSERT+UPDATE)tbl_party_transaction,tbl_party_transaction_detail,tbl_party_transaction_detail_history', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");
	
	$response['success']=1;
	$response['details']="Bill Successfully Updated";
}
else
{
	$response['success']=0;
	$response['details']="Required Field Missing...!!";
}		
echo json_encode($response);
?> 