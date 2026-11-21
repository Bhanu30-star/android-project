<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['start_date']) && isset($_POST['end_date']))
{
	$cdate1 = $_POST['start_date'];
	$cdate2 = $_POST['end_date'];
	$session_dist_ver = $_POST['distributor_id'];
	$res = mysqli_query($con,"select product_id,product_name,sum(quantity) as tqty,product_price from tbl_party_transaction_detail where transaction_id in (SELECT transaction_id FROM `tbl_party_transaction` where transaction_date>='$cdate1' and transaction_date<='$cdate2' and transaction_from in (select user_id from tbl_user where distributor_id='$session_dist_ver')) group by product_id ASC");
	$product=array();
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product2=mysqli_fetch_array($res))
		{
			$temp_txn_id=$fetch_product2['product_id'];
			$res_product = mysqli_query($con,"select purchase_price from tbl_product where `distributor_id` = '$session_dist_ver' and product_id='$temp_txn_id'");
			$fetch_data=mysqli_fetch_assoc($res_product);
			$return_profit=($fetch_product2['tqty']*$fetch_product2['product_price'])-($fetch_product2['tqty']*$fetch_data['purchase_price']);	
			$product['product_name']=$fetch_product2['product_name'];
			$product['sale_qty']=$fetch_product2['tqty'];
			$product['purchase_price']=$fetch_data['purchase_price'];
			$product['sale_price']=$fetch_product2['product_price'];
			$product['profit']=round($return_profit,2);
			$response['Product_profit'][]=$product;
		}
	}
	else
	{
		$response['Product_profit']=$product;
	}
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