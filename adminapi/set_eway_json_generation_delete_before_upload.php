<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['transaction_id']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$eway_txn=$_POST['transaction_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("H:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$query1=mysqli_query($con,"select * from tbl_party_eway where transaction_id='$eway_txn' and distributor_id='$session_dist_ver' and ewayBillNo='' and status='Pending'");
	if(mysqli_num_rows($query1)>0)
	{     
		$query_delete_detail = mysqli_query($con,"delete from tbl_party_eway_detail where transaction_id='$eway_txn'");
		if($query_delete_detail)
		{
			$query_update = mysqli_query($con,"delete from tbl_party_eway where transaction_id='$eway_txn' and distributor_id='$session_dist_ver' and status='Pending' and ewayBillNo=''");
			$response['success']='1';
			$response['details']="Transaction Detail Successfully Deleted...!!";
		}
	}
	else
	{
		$response['success']='0';
		$response['details']="Transaction Not Deleted.!!";
	}
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>