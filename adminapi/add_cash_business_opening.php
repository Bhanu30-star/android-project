<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['cashamtopen']) && isset($_POST['distributor_id']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$cash=$_POST['cashamtopen'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate=date("Y-m-d");
	$scri=date('H:i:sa');
	$res_product_stock = mysqli_query($con,"SELECT * FROM  tbl_distributor_cash_collection where  distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($res_product_stock)<=0)
	{
		$query1 = mysqli_query($con,"INSERT INTO tbl_distributor_cash_collection(distributor_id, opening_amt,closing_amt,date,time) VALUES ('$session_dist_ver','$cash','$cash','$cdate','$scri')");
		// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$session_dist_ver', 'INSERT OPERATION,Cash Collection#Admin(INSERT) tbl_distributor_cash_collection', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");
		$response['success']='1';
		$response['message']="Cash Detail Successfully Inserted!!";	
	}
	else if(mysqli_num_rows($res_product_stock)==1)
	{
		$uq_1=mysqli_query($con,"update tbl_distributor_cash_collection SET opening_amt='$cash',closing_amt='$cash',date='$da' where distributor_id='$session_dist_ver'");
		$response['success']='1';
		$response['message']="Cash Detail Successfully Updated!!";	
	}
	else
	{
		$response['success']='0';
		$response['message']="Cash Detail Already Exists";	
	}
}
else
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);
?>