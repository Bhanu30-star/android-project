<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['head_id']) && isset($_POST['distributor_id']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$status=$_POST['status'];
	$id1=$_POST['head_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate11=date("Y-m-d");
	$rs1=mysqli_query($con,"select * from tbl_expense_head where distributor_id='$session_dist_ver' and head_id='$id1'");
	if(mysqli_num_rows($rs1)>0)
	{
		$uq1=mysqli_query($con,"UPDATE tbl_expense_head SET status='$status' where head_id='$id1'");
		$response['success']='1';
		$response['message']="Head Status Successfully Updated";
	}
	else
	{
		$response['success']='0';
		$response['message']="Head Id Not Valid";
	}
}
else
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);

?>