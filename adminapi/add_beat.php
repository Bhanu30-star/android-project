<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['beatname']) && isset($_POST['distributor_id']))
{
	$ver = $_POST['distributor_id'];
	$pname=$_POST['beatname'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate=date("Y-m-d");
	$scri=date('H:i:sa');
	$res_product_stock = mysqli_query($con,"SELECT * FROM  tbl_distributor_beat where beat_name='$pname' and distributor_id='$ver'");
	if(mysqli_num_rows($res_product_stock)<=0)
	{
		$query = mysqli_query($con,"INSERT INTO `tbl_distributor_beat`(`distributor_id`, `beat_name`, `status`, `insert_date`, `insert_time`) VALUES ('$ver','$pname','Active','$cdate','$scri')");
		$response['success']='1';
		$response['details']="Beat Successfully Inserted";
	}			
	else
	{
		$response['success']='0';
		$response['details']="Beat already exists";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>