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
	$einv_type=$_POST['einv_type'];
	if($einv_type=='Process')
	{
		$query1=mysqli_query($con,"select * from tbl_party_einvoice_generation_process where transaction_id='$einv_txn' and distributor_id='$session_dist_ver'");
		if(mysqli_num_rows($query1)>0)
		{     
			$res = mysqli_query($con,"update `tbl_party_einvoice_generation_process` set `status`='Hold' where `distributor_id`='$session_dist_ver' and `transaction_id`='$einv_txn'");
			$response['success']='1';
			$response['details']="Transaction Detail Successfully Hold for E-Invoice...!!";
		}
		else
		{
			$response['success']='0';
			$response['details']="Transaction Detail not Available...!!";
		}
	}
	else
	{
		$query1=mysqli_query($con,"select * from tbl_party_einvoice_generation_process where transaction_id='$einv_txn' and distributor_id='$session_dist_ver'");
		if(mysqli_num_rows($query1)==0)
		{     
			$res=mysqli_query($con,"INSERT INTO `tbl_party_einvoice_generation_process`(`distributor_id`,`transaction_id`,`insert_date`,`insert_time`,`status`) VALUES ('$session_dist_ver','$einv_txn','$da','$ctime','Hold')");
			$response['success']='1';
			$response['details']="Transaction Detail Successfully Hold for E-Invoice...!!";
		}
		else
		{
			$query_update = mysqli_query($con,"delete from tbl_party_einvoice_generation_process where status='Hold' and transaction_id='$einv_txn' and distributor_id='$session_dist_ver'");
			$response['success']='1';
			$response['details']="Transaction Successfully ready for Generate E-Invoice...!!";
		}
	}
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>