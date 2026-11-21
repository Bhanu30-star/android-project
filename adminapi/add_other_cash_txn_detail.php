<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['partydetail']) && isset($_POST['distributor_id']) && isset($_POST['txn_type']) && isset($_POST['txn_amount']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$userdetail=mysqli_real_escape_string($con,$_POST['partydetail']);
    $bill_type21=$_POST['txn_type'];
    $txn_amunt=$_POST['txn_amount'];
	$remark=mysqli_real_escape_string($con,$_POST['remark']);
	$date21=$_POST['txn_date'];
	$insrt=mysqli_query($con,"INSERT INTO `tbl_other_cash_txn_master`(`distributor_id`, `retailer_detail`, `insert_date`, `txn_amount`, `txn_type`, `remark`, `status`) VALUES ('$session_dist_ver','$userdetail','$date21','$txn_amunt','$bill_type21','$remark','Complete')");
	// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$session_dist_ver', 'INSERT OPERATION,Added Other Cash Transaction#Admin(INSERT)tbl_other_cash_txn_master', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");
	if($insrt)
	{
		include("cash_bank_effect_class.php");
		if($bill_type21=='To Receive')
		{
			$CashCollection=new Collection();
			$collections=$CashCollection->purchasecashcollection($session_dist_ver,$txn_amunt,$date21);
		}
		else
		{
			$CashCollection=new Collection();
			$collections=$CashCollection->cashcollection($session_dist_ver,$txn_amunt,$date21);
		}
	}
	$response['success']='1';
	$response['message']="Other Transaction successfully Inserted";
}
else
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);
?>