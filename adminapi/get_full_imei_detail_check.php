<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['imeicheck']))
{
	$ver=$_POST['distributor_id'];
	$cartimeicheck=$_POST['imeicheck'];
	$product_cart=mysqli_query($con,"SELECT * FROM tbl_product_serialno,tbl_product where tbl_product.product_id = tbl_product_serialno.product_id and tbl_product_serialno.IMEI like '%$cartimeicheck%' and tbl_product.distributor_id='$ver'");
	if(mysqli_num_rows($product_cart)>0)
	{   
		$fetch_pro_detail=mysqli_fetch_assoc($product_cart);
		$response['success']='0';
		$response['message']="Dplicate Stock IMEI No - ".$fetch_pro_detail['product_name'];
	}
	else
	{
		$response['success']='1';
		$response['message']="Valid IMEI Detail";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required Feild Missing!!";
}	
echo json_encode($response);
?>