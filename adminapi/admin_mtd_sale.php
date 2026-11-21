<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']))
{
	$ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate  = date("Y-m-d");
	$temp_month=date("m");
	$temp_year=date("Y");
	$product=array();

	$start_date=$temp_year."-".$temp_month."-01";
	$select_product1=mysqli_query($con,"SELECT product_id,product_name FROM tbl_product where distributor_id='$ver' and status='Active'");
	while($fetch_product1=mysqli_fetch_array($select_product1))
	{
		$closing_stock=0;
		$product_id=$fetch_product1['product_id'];
		$product_name=$fetch_product1['product_name'];
		$select_product2=mysqli_query($con,"SELECT user_id FROM tbl_user where status='Active' and distributor_id='$ver'");
		while($fetch_product2=mysqli_fetch_array($select_product2))
		{
			$temp_u_id=$fetch_product2['user_id'];
			$product_detail=mysqli_query($con,"SELECT tbl_party_transaction_detail.quantity FROM tbl_party_transaction,tbl_party_transaction_detail where tbl_party_transaction.transaction_id=tbl_party_transaction_detail.transaction_id and tbl_party_transaction.transaction_date>='$start_date' and tbl_party_transaction.transaction_date<='$cdate' and tbl_party_transaction.transaction_from='$temp_u_id' and tbl_party_transaction_detail.product_id='$product_id'");
			if(mysqli_num_rows($product_detail)>0)
			{     
				while($fetch_detail=mysqli_fetch_array($product_detail))
				{
					$closing_stock=$closing_stock+$fetch_detail['quantity'];
				} 
			}
		}
		$product['product_id']=$product_id;
		$product['product_name']=$product_name;
		$product['quantity']=$closing_stock;
		$response['product'][]=$product;
	}
	$response['success']='1';
	$response['message']="Fetch Detail Successful";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>