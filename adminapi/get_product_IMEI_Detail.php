<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']))
{
	$userid=$_POST['distributor_id'];
	$proid = isset($_POST['product_id']) ? $_POST['product_id'] : '';
	if($proid!='')
	{
		$product_detail=mysqli_query($con,"SELECT * FROM tbl_product_serialno where product_id in (select product_id from tbl_product where distributor_id='$userid' and product_type='Serial No' and product_id='$proid') and status='Available' and user_id='0' order by stock_id asc");
	}
	else
	{
		$product_detail=mysqli_query($con,"SELECT * FROM tbl_product_serialno where product_id in (select product_id from tbl_product where distributor_id='$userid' and product_type='Serial No') and status='Available' and user_id='0' order by stock_id asc");
	}
	
	if(mysqli_num_rows($product_detail)>0)
	{   
		$product=array();
		while($fetch_detail=mysqli_fetch_assoc($product_detail))
		{
			$product['product_id']=$fetch_detail['product_id'];
			$product['IMEI_no']=$fetch_detail['IMEI'];
			$response['product'][]=$product;
		} 
		$response['success']='1';
		$response['message']="Fetch Detail Successful";
	}
	else
	{
		$response['success']='0';
		$response['message']="IMEI Detail Not Available";
	}
}
else
{
	$response['success']='0';
	$response['details']="Error in Loggin in!! Please update app from Google Play Store and try again!!";
}	
echo json_encode($response);
?>