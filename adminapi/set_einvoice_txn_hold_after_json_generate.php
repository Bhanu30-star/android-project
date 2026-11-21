<?php
include("../../connect.php");
$response = array();
if(isset($_POST['txn_did']) && isset($_POST['distributor_id']) )
{
	$session_dist_ver = $_POST['distributor_id'];
	$einv_txn=$_POST['txn_did'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$da  = date("Y-m-d");
	$ctime  = date("H:i:s");
	$query1=mysqli_query($con,"select * from tbl_party_einvoice where transaction_id='$einv_txn' and distributor_id='$session_dist_ver' and status='Pending'");
	if(mysqli_num_rows($query1)>0)
	{ 
		$query_delete_detail = mysqli_query($con,"delete from tbl_party_einvoice_detail where transaction_id='$einv_txn'");
		if($query_delete_detail)
		{
			$query_update = mysqli_query($con,"delete from tbl_party_einvoice where transaction_id='$einv_txn' and distributor_id='$session_dist_ver' and status='Pending'");
			$response['success']='1';
			$response['details']="Transaction Successfully Hold for E-Invoice...!!";
		}
	}
	else
	{
		$response['success']='0';
		$response['details']="Transaction Not Available...!!";
	}
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>