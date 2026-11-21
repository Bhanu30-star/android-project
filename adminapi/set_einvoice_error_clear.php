<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']) )
{
	$session_dist_ver = $_POST['distributor_id'];
	$er_id=$_POST['error_id'];
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
	$prty_error_delete=mysqli_query($con,"delete from tbl_party_einvoice_error WHERE distributor_id='0' or transaction_id='0'");
	if($_POST['error_id']!='')
	{
		$prty_updt=mysqli_query($con,"UPDATE tbl_party_einvoice_error SET `status`='Clear' WHERE distributor_id='$session_dist_ver' and status='Pending' and error_id='$er_id'");
	}
	else
	{
		$prty_updt=mysqli_query($con,"UPDATE tbl_party_einvoice_error SET `status`='Clear' WHERE distributor_id='$session_dist_ver' and status='Pending'");
	}
	if($prty_updt)
	{
		$response['success']='1';
		$response['details']="E-Invoice Error JSON Successfully Cleared...!!";
	}
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>