<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']))
{
	$dis_id = $_POST['distributor_id'];
	$select_product=mysqli_query($con,"SELECT tbl_product_serialno.stock_id,tbl_product_serialno.product_id,tbl_product_serialno.IMEI FROM tbl_product_serialno,tbl_product where  tbl_product_serialno.product_id=tbl_product.product_id and  tbl_product_serialno.status='Available' and tbl_product.distributor_id='$dis_id' and tbl_product_serialno.user_id='0'");
	if(mysqli_num_rows($select_product)>0)
	{     
		$product=array();
		while($fetch_product=mysqli_fetch_array($select_product))
		{
			$product['stock_id']=$fetch_product['stock_id'];
			$product['product_id']=$fetch_product['product_id'];
			$product['IMEI']=$fetch_product['IMEI'];
			$response['product'][]=$product;
		}
		$response['success']='1';
		$response['message']="Fetch Detail Successful";
	}
	else
	{
		$response['success']='0';
		$response['message']="Distributor have no stock";
	}
	
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>