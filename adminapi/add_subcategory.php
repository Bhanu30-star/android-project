<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['category_id']) && isset($_POST['distributor_id']) && isset($_POST['subcatname']))
{
	$ver = $_POST['distributor_id'];
	$catname=$_POST['category_id'];
	$subcatname=$_POST['subcatname'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate  = date("Y-m-d")." ".date('H:i:sa');
	$scro=date("Y-m-d");
	$scri=date('H:i:sa');
	$res_product_stock1 = mysqli_query($con,"SELECT * FROM  tbl_product_subcategory_master where subcategory_name='$subcatname' and category_id='$catname'");
	if(mysqli_num_rows($res_product_stock1)==0)
	{
		$query = mysqli_query($con,"INSERT INTO `tbl_product_subcategory_master`( `category_id`, `subcategory_name`, `status`, `insert_date`, `insert_time`) VALUES ('$catname','$subcatname','Active','$scro','$scri')");
		// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$ver', 'INSERT OPERATION,Add Subcategory#Admin(INSERT) tbl_product_subcategory_master', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");
	
		$response['success']='1';
		$response['details']="Insert Successful";			
	}
	else
	{
		$response['success']='1';
		$response['details']="Sub-Category already exists";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>