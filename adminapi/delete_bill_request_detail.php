<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['request_id']) && isset($_POST['distributor_id']))
{
	$requestid = $_POST['request_id'];
	$dis_id = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$product=array();
	$select_product = mysqli_query($con,"select * from tbl_bill_generation_process_support where distributor_id='$dis_id' and request_id='$requestid' and status='Pending'");
	if(mysqli_num_rows($select_product)>0)
	{     
		$req_delete = mysqli_query($con,"update tbl_bill_generation_process_support set status='Delete' where distributor_id='$dis_id' and request_id='$requestid' and status='Pending'");
		$response['success']='1';
		$response['message']="Request Successfully Deleted";
	}
	else
	{
		$response['success']='0';
		$response['details']="Delete Action not perform.Request Already Processed for bill.";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required Feild Missing!!";
}	
echo json_encode($response);
?>