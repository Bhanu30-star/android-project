<?php
include("../../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']))
{
	$userid = $_POST['distributor_id'];
	$proid = $_POST['product_id'];
	$IMEI_no = $_POST['IMEI_no'];
	$process_type = $_POST['process_type'];
	
	if($process_type=='Standard')
	{
		$product_detail=mysqli_query($con,"SELECT * FROM tbl_product_serialno where product_id in (select product_id from tbl_product where distributor_id='$userid' and product_type='Serial No' and product_id='$proid') and status='Available' and user_id='0' and IMEI='$IMEI_no'");
		if(mysqli_num_rows($product_detail)>0)
		{   
			$response['success']='1';
			$response['message']="IMEI is Valid";
		}
		else
		{
			$response['success']='0';
			$response['message']="Not Valid IMEI No";
		}
	}
	else
	{
		$product_detail=mysqli_query($con,"SELECT * FROM tbl_party_transaction_detail where product_id in (select product_id from tbl_product where distributor_id='$userid' and product_type='Serial No' and product_id='$proid')");
		if(mysqli_num_rows($product_detail)>0)
		{   
			$response['success']='0';
			$response['message']="Alreday Sold";
		}
		else
		{
			$response['success']='1';
			$response['message']="IMEI is Valid";
		}
	}
}
else
{
	$response['success']='0';
	$response['details']="Required Feild Missing!";
}	
echo json_encode($response);
?>