<?php
include("../../connect.php"); 
$response = array();
date_default_timezone_set('Asia/Calcutta');
	$clientIP = $_SERVER['REMOTE_ADDR'];
	$apiUrl = "http://ipinfo.io/{$clientIP}/json";
	$response1 = file_get_contents($apiUrl);
	$details = json_decode($response1, true);
	if($details['country']=='AE')
	{
		date_default_timezone_set('Asia/Dubai');
	}
if(isset($_POST['product_id']) && isset($_POST['unit_count']) && isset($_POST['distributor_id']))
{
	$ver = $_POST['distributor_id'];
	$consume_pro_id=$_POST['product_id'];
	$p_qty_val=round($_POST['unit_count'],2);
	$unit_1=$_POST['unit_1'];
	$unit_2=$_POST['unit_2'];
	$sale_price=$_POST['sale_price'];
	$conversion_check=mysqli_query($con,"SELECT * FROM tbl_product_conversion_unit WHERE product_id='$consume_pro_id' and total_unit='$p_qty_val' and status='Active'");
	if(mysqli_num_rows($conversion_check)<=0)
	{
		$query_update = mysqli_query($con,"update `tbl_product_conversion_unit` set primary_value='No' where product_id='$consume_pro_id' and status='Active'");										
		$query_insert = mysqli_query($con,"INSERT INTO `tbl_product_conversion_unit`(`product_id`, `conversion_detail`, `total_unit`, `conversion_unit`, `primary_value`, `status`,sale_price) VALUES ('$consume_pro_id','$unit_1','$p_qty_val','$unit_2','Yes','Active','$sale_price')");
		$response['success']='1';
		$response['message']="Insert Successful";
	}
	else
	{
		$response['success']='0';
		$response['message']="Conversion Unit already exists";
	}
}
else if(isset($_POST['reomove_detail_id']))
{
	$detail_id=$_POST["reomove_detail_id"];
	$cdate  = date("Y-m-d");
	$conversion_check=mysqli_query($con,"SELECT * FROM tbl_product_conversion_unit WHERE detail_id='$detail_id'");
	$fetch_condition=mysqli_fetch_assoc($conversion_check);
	$detail_type_val=$fetch_condition['primary_value'];
	$consume_pro_id=$fetch_condition['product_id'];
	if($detail_type_val=="Yes")
	{
		 $query_2=mysqli_query($con,"update tbl_product_conversion_unit set primary_value='Yes' WHERE detail_id!='$detail_id' order by detail_id asc limit 1");
		 $query_delete=mysqli_query($con,"update tbl_product_conversion_unit set status='Deleted' WHERE detail_id='$detail_id'");
	}
	else
	{
		$query_delete=mysqli_query($con,"update tbl_product_conversion_unit set status='Deleted' WHERE detail_id='$detail_id'");
	}
	$response['success']='1';
	$response['message']="Delete Successful";
}
else if(isset($_POST['list_detail_id']) && isset($_POST['product_id']))
{
	$p_list_data=$_POST['list_detail_id'];
	$consume_pro_id=$_POST['product_id'];
	$query_update1 = mysqli_query($con,"update`tbl_product_conversion_unit` set primary_value='Yes' where product_id='$consume_pro_id' and detail_id='$p_list_data' and status='Active'");										
	$query_update2 = mysqli_query($con,"update`tbl_product_conversion_unit` set primary_value='No' where product_id='$consume_pro_id' and detail_id!='$p_list_data' and status='Active'");
	$response['success']='1';
	$response['message']="Update Successfully";
}
else
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);

?>