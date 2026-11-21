<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['request_id']) && isset($_POST['order_status']))
{
	date_default_timezone_set('Asia/Calcutta');
	$da  = date("Y-m-d")." ".date('H:i:sa');
	$cdate=date("Y-m-d");
	$scri=date('H:i:sa');
	$req_id=$_POST['request_id'];
	$remark=$_POST['remark'];
	$order_status=$_POST['order_status'];
	
	$rs=mysqli_query($con,"select order_status from tbl_distributor_pop_request where request_id='$req_id'");
	if(mysqli_num_rows($rs)>0)
	{										
		$uq1=mysqli_query($con,"update tbl_distributor_pop_request set order_status='$order_status', remark='$remark', accept_datetime='$da' where request_id='$req_id'");
		if($order_status=='Reject'){
			$uq1=mysqli_query($con,"update tbl_distributor_pop_request set reject_by='Distributor' where request_id='$req_id'");
		} 
		$response['success']='1';
		$response['details']="Status update successfully";
	}
	else
	{
		$response['success']='0';
		$response['details']="Request Id not valid.. Please check and try again later!!";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>