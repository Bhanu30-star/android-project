<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']))
{
	$session_dist_ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$da  = date("Y-m-d");
	$stockbook=array();
	$res_detail = mysqli_query($con,"SELECT * FROM tbl_distributor_transaction,tbl_product WHERE tbl_distributor_transaction.product_id=tbl_product.product_id AND tbl_distributor_transaction.distributor_id='$session_dist_ver' and tbl_distributor_transaction.purchase_category='Opening Stock' and tbl_product.product_type in ('Service','FMCG') ORDER by tbl_distributor_transaction.transaction_id asc");
    if(mysqli_num_rows($res_detail)>0) 
	{     
		while($fetch_product2=mysqli_fetch_assoc($res_detail)) 
		{
			$stockbook['transaction_id']=$fetch_product2['transaction_id'];
			$stockbook['transaction_date']=$fetch_product2['transaction_date'];
			$stockbook['available_stock']=$fetch_product2['stock_quantity'];
			$stockbook['product_id']=$fetch_product2['product_id'];
			$stockbook['product_name']=$fetch_product2['product_name'];
			$stockbook['product_price']=$fetch_product2['product_price'];
			$stockbook['bag_type']=$fetch_product2['bag_type'];
			$stockbook['bag_qty']=$fetch_product2['bag_qty'];
			$stockbook['quantity']=$fetch_product2['quantity'];
			$response['stockbook'][]=$stockbook;
		}
	}
	else
	{
		$response['stockbook']=$stockbook;
	}
	$response['success']='1';
	$response['details']="Stock Detail Successfully Fetch";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>