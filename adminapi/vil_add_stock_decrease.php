<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']))
{
	$date=$_POST['date'];
	$dist_id=$_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$dist_id'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$date1  = date("Y-m-d");
	$r_date=strtotime($date1);
	$r2_date= strtotime("-30 day", $r_date);
	$d2_date=trim(date('Y-m-d', $r2_date));
	$message=array();
	$select_product=mysqli_query($con,"SELECT * FROM tbl_distributor_stock_add_reduce where distributor_id='$dist_id' and message_date='$date'order by id ASC");
	if(mysqli_num_rows($select_product)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($select_product))
		{
			$message['message_id']=$fetch_product['message_id'];
			$message['transaction_id']=$fetch_product['transaction_id'];
			$message['amount']=$fetch_product['quantity'];
			$message['status']=$fetch_product['status'];
			$response['message'][]=$message;
		}
	}
	else
	{
		$response['message']=$message;
	}
	$select_product=mysqli_query($con,"SELECT * FROM tbl_product where status='Active' and distributor_id='$dist_id' and product_category ='VODA LAPU' order by product_id ASC");
	$product=array();
	if(mysqli_num_rows($select_product)>0)
	{     
		while($fetch_product=mysqli_fetch_array($select_product))
		{
			$product['product_id']=$fetch_product['product_id'];
			$product['product_name']=$fetch_product['product_name'];
			$product['product_price']=$fetch_product['product_price'];
			$product['stock_quantity']=$fetch_product['stock_quantity'];
			$product['product_category']=$fetch_product['product_category'];
			$response['product'][]=$product;
		}
	}else{
		$response['product']=$product;
	}
	$response['success']='1';
	$response['details']="Fetch Detail Successful";
	}
else
{
	$response['success']='0';
	$response['details']="Required field missing!!";
}	
mysqli_close($con);
echo json_encode($response);
?>