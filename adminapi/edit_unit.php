<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['catname']) && isset($_POST['distributor_id']) && isset($_POST['catid']))
{
	$ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$catname=$_POST['catname'];
	$catid=$_POST['catid'];
	$cdate  = date("Y-m-d")." ".date('H:i:sa');
	$scro=date("Y-m-d");
	$scri=date('H:i:sa');
	
	$res_product_stock1 = mysqli_query($con,"SELECT * FROM  tbl_measurement_unit where unit_name='$catname'");
	$res_product_stock2 = mysqli_query($con,"SELECT * FROM  tbl_product_unit_master where unit_id!='$catid' and distributor_id='$ver' and unit_name='$catname'");
	if(mysqli_num_rows($res_product_stock1)==0 && mysqli_num_rows($res_product_stock2)==0)
	{
		$uq1=mysqli_query($con,"UPDATE tbl_product_unit_master SET unit_name='$catname' where unit_id='$catid' and distributor_id='$ver' ");
		$response['success']='1';
		$response['message']="Update Successful";			
	}
	else
	{
		$response['success']='0';
		$response['message']="Unit already exists";
	}
} 
else if(isset($_POST['distributor_id']) && isset($_POST['cat_id']))
{
	$ver = $_POST['distributor_id'];
	$id1=$_POST['cat_id'];
	$res = mysqli_query($con,"select * from tbl_product_unit_master where unit_id='$id1'");
	while($ver1 = mysqli_fetch_assoc($res))
	{
		$delete_status=$ver1['status'];
	}
	if($delete_status=='Active')
	{
		$uq1=mysqli_query($con,"UPDATE tbl_product_unit_master SET status='Deactive' where unit_id='$id1'");
	}
	if($delete_status=='Deactive')
	{
		$uq1=mysqli_query($con,"UPDATE tbl_product_unit_master SET status='Active' where unit_id='$id1'");
	}
	// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$ver','UPDATE OPERATION,Edit unit#Admin(UPDATE)tbl_product_unit_master', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");
	if($uq1)
	{
		$response['success']='1';
		$response['message']="Unit Successfully Update";
	}
	else
	{
		$response['success']='0';
		$response['message']="Action Not Allowed";
	}
}
else
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);
?>