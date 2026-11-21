<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['upi_detail']) && isset($_POST['distributor_id']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$bname=$_POST['upi_detail'];
	$banktype=$_POST['upitype'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate11  = date("Y-m-d")." ".date("H:i:s");
	$rs1=mysqli_query($con,"select * from tbl_distributor_upi_master where distributor_id='$session_dist_ver' and upi_detail='$bname'");
	if(mysqli_num_rows($rs1)<=0)
	{
		if($banktype=='Primary')
		{
			$uq21=mysqli_query($con,"update tbl_distributor_upi_master set type='Secondary' where distributor_id='$session_dist_ver'");
			$query = mysqli_query($con,"INSERT INTO `tbl_distributor_upi_master`( `distributor_id`, `upi_detail`, `insert_date`,`type`) VALUES ('$session_dist_ver','$bname','$cdate11','$banktype')");
		}
		else
		{
			$query = mysqli_query($con,"INSERT INTO `tbl_distributor_upi_master`( `distributor_id`, `upi_detail`, `insert_date`,`type`) VALUES ('$session_dist_ver','$bname','$cdate11','$banktype')");
		}
		$response['success']='1';
		$response['message']="UPI Detail Successfully Inserted";
	}
	else
	{
		$response['success']='0';
		$response['message']="UPI Detail Already Exists";
	}
}
else
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);

?>