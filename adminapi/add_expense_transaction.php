<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['ehead_id']) && isset($_POST['distributor_id']) && isset($_POST['billno']) && isset($_POST['amount']) && isset($_POST['remark']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$ehead=$_POST['ehead_id'];
	$billno=$_POST['billno'];
	$amunt=$_POST['amount'];
	$remark=$_POST['remark'];
	$bill_type=$_POST['bill_type'];
	$tax_amt=isset($_POST['tax_amt']) ? $_POST['tax_amt'] : '0';
	$gstin_no=isset($_POST['gstin_no']) ? $_POST['gstin_no'] : '';
	$taxable_amt=isset($_POST['taxable_amt']) ? $_POST['taxable_amt'] : '0';
	$payment_mode=$_POST['payment_mode'];
	$bankdetail=$_POST['bankdetail'];
	$cashamt=isset($_POST['cashamt']) ? $_POST['cashamt'] : '0';
	$bankamt=isset($_POST['bankamt']) ? $_POST['bankamt'] : '0';
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate11  = date("Y-m-d");
	$expense_date = isset($_POST['expense_date']) ? $_POST['expense_date'] : $cdate11;
	$insrt=mysqli_query($con,"INSERT INTO tbl_distributor_expenses_master (`distributor_id`,`head_id`,`bill_no`, `final_amount`, `remark`,`status`,`insert_date`,`bill_type`,`gstin_no`,`tax_amt`,`taxable_amt`,`payment_mode`,`bank_id`, `cash_amt`, `bank_amt`,`date`) VALUES ('$session_dist_ver','$ehead','$billno','$amunt','$remark','Complete','$expense_date','$bill_type','$gstin_no','$tax_amt','$taxable_amt','$payment_mode','$bankdetail','$cashamt','$bankamt','$expense_date')");
	// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$session_dist_ver','INSERT OPERATION,Added Expense Transaction#Admin(INSERT) tbl_distributor_expenses_master', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");
	if($insrt)
	{
		include("cash_bank_effect_class.php");
		if ($payment_mode == 'Cash') {
			$CashCollection=new Collection();
			$collections=$CashCollection->purchasecashcollection($session_dist_ver,$cashamt,$expense_date);
		} 
		else if ($payment_mode == 'Bank')
		{
			$CashCollection=new Collection();
			$collections=$CashCollection->purchasebankcollection($session_dist_ver,$bankdetail,$bankamt,$expense_date);
		}
	}
	$response['success']='1';
	$response['message']="Expense Transaction successfully Inserted";
}
else
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);

?>