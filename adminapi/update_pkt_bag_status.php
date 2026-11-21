<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['bag_id']) && isset($_POST['status']))
{
	$id1 = $_POST['bag_id'];
	$status = $_POST['status'];
	date_default_timezone_set('Asia/Calcutta');
	$cdate  = date("Y-m-d")." ".date('H:i:sa');
	$res = mysqli_query($con,"select * from tbl_distributor_bag_detail where bag_id='$id1'");	
	if(mysqli_num_rows($res)>0)
	{
		$uq1=mysqli_query($con,"UPDATE tbl_distributor_bag_detail SET status='$status',update_datetime='$cdate' where bag_id='$id1'");
		$response['success']='1';
		$response['message']="Update status successfully";
	}
	else
	{
		$response['success']='0';
		$response['message']="Bag Id Not Valid!!";
	}
}
else
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);

?>