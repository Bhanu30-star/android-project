<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['request_id']) && isset($_POST['distributor_id']) && isset($_POST['user_id']) && isset($_POST['distributor_user_id']))
{
	$request_id = $_POST['request_id'];
	$dis_uid = $_POST['distributor_user_id'];
	$ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$select_user=mysqli_query($con,"SELECT imei_no,session_id FROM tbl_distributor_users where status='Active' and distributor_user_id='$dis_uid'");
	if(mysqli_num_rows($select_user)>0)
	{     
		while($fetch_user=mysqli_fetch_array($select_user))
		{
			$response['user_status']='1';
			$response['user_imei']=$fetch_user['imei_no'];
			$response['session_id']=$fetch_user['session_id'];
		}
	}
	else
	{
		$response['user_status']='0';
		$response['session_id']='';
		$response['user_imei']='';
	}
	$temp_user_id = $_POST['user_id'];
	$da  = date("Y-m-d");
	$dsr_day_control=mysqli_query($con,"SELECT control_id FROM tbl_distributor_business_control where insert_date='$da' and distributor_id='$ver'");  
	if(mysqli_num_rows($dsr_day_control)<=0)
		$day_control=0;
	else
		$day_control=1;
	$dsr_fse_submit=mysqli_query($con,"SELECT dsr_id FROM tbl_dsr where date='$da' and user_id='$temp_user_id' and dsr_status in ('Pending','Accept')");
	if(mysqli_num_rows($dsr_fse_submit)<=0)
		$fseday_control=0;
	else
		$fseday_control=1;
	$res11 = mysqli_query($con,"select tbl_user_request_detail.transaction_detail_id,tbl_user_request_detail.product_name,tbl_product.stock_quantity,tbl_user_request_detail.quantity,tbl_product.decimal_category,tbl_user_request_detail.product_id,tbl_product.product_price,tbl_product.purchase_price,tbl_product.serial_type from tbl_user_request_detail,tbl_product where  tbl_user_request_detail.product_id=tbl_product.product_id and tbl_user_request_detail.transaction_id='$request_id'");
	if(mysqli_num_rows($res11)>0)
	{    
		$detail=array();
		while($fetch_product=mysqli_fetch_assoc($res11))
		{
			$detail['transaction_detail_id']=$fetch_product['transaction_detail_id'];
			$detail['product_id']=$fetch_product['product_id'];
			$detail['product_name']=$fetch_product['product_name'];
			$detail['product_price']=$fetch_product['product_price'];
			$detail['purchase_price']=$fetch_product['purchase_price'];
			$detail['distributor_stock']=$fetch_product['stock_quantity'];
			$detail['serial_type']=$fetch_product['serial_type'];
			$detail['quantity']=$fetch_product['quantity'];
			$detail['decimal_category']=$fetch_product['decimal_category'];
			$response['detail'][]=$detail;
		}
	}
	$response['day_control']=$day_control;
	$response['fseday_control']=$fseday_control;
	$response['success']='1';

	$response['details']="Fetch Detail Successful";

}

else

{

	$response['success']='0';

	$response['details']="Required field missing";

}	

echo json_encode($response);



?>