<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['bagqty']) && isset($_POST['distributor_id']))
{
	$ver = $_POST['distributor_id'];
	$bagqty=$_POST['bagqty'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate  = date("Y-m-d")." ".date('H:i:sa');
	$res_product_stock1 = mysqli_query($con,"SELECT * FROM  tbl_distributor_bag_detail where bag_qty='$bagqty' and distributor_id='$ver'");
	if(mysqli_num_rows($res_product_stock1)<=0)
	{
		$query = mysqli_query($con,"INSERT INTO `tbl_distributor_bag_detail`(`distributor_id`, `bag_qty`, `status`, `insert_datetime`) VALUES ('$ver','$bagqty','Active','$cdate')");
		$response['success']='1';
		$response['message']="Bag Successful Inserted";			
	}
	else
	{
		$response['success']='0';
		$response['message']="Bag already exists";
	}
}
else
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);

?>