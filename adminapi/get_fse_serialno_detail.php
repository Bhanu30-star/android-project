<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['user_id']))
{
	$userid=$_POST['user_id'];
	$product_detail=mysqli_query($con,"SELECT * FROM tbl_product_serialno where user_id='$userid' and status='Available' order by stock_id asc");
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