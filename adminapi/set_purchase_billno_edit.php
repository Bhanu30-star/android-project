<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['bill_no']) && isset($_POST['distributor_id']) && isset($_POST['partyid']) && isset($_POST['billunique']) && isset($_POST['billdate']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$pname=strtoupper($_POST['bill_no']);
	$pid11=$_POST['partyid'];
	$uid11=$_POST['billunique'];
	$billdate1=$_POST['billdate'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate  = date("Y-m-d")." ".date('H:i:sa');
	$scro=date("Y-m-d");
	$scri=date('H:i:sa');
	
	$res_product_stock = mysqli_query($con,"SELECT * FROM  tbl_distributor_transaction where distributor_id='$session_dist_ver' and unique_bill='$uid11' and party_id='$pid11' and txn_type='Add'");
	if(mysqli_num_rows($res_product_stock)>0)
	{
		$uq1=mysqli_query($con,"UPDATE tbl_distributor_transaction SET bill_no='$pname',update_bill_datetime='$cdate',bill_date='$billdate1' where unique_bill='$uid11' and party_id='$pid11' and distributor_id='$session_dist_ver' and txn_type='Add'");

		$uq2=mysqli_query($con,"UPDATE tbl_purchase_return_transaction SET bill_no='$pname',bill_date='$billdate1' where unique_bill='$uid11' and party_id='$pid11' and distributor_id='$session_dist_ver'");

		$uq3=mysqli_query($con,"UPDATE tbl_purchase_payment_transaction SET bill_no='$pname' where unique_bill='$uid11' and distributor_id='$session_dist_ver'");
											
		$uq4=mysqli_query($con,"UPDATE tbl_distributor_transaction_charges SET bill_no='$pname',bill_date='$billdate1' where unique_bill='$uid11' and distributor_id='$session_dist_ver'");
		
		$response['success']='1';
		$response['message']="Bill Detail Successfully Updated!!";	
	}
	else 
	{
		$response['success']='0';
		$response['message']="Bill Detail Not Matched!!";	
	}
}
else
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);
?>