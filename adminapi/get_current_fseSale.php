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
	$executive=array();
	$res = mysqli_query($con,"select user_name,user_id from tbl_user where distributor_id='$ver'");	
	while($fetch_product=mysqli_fetch_assoc($res))
	{
		extract($fetch_product);
		$temp_uid=$user_id;
		$temp_closing_stock=0;
		$temp_ar=1;
		$executive['fse_name']=$fetch_product['user_name'];
		$res_denom1 = mysqli_query($con,"select product_id  from tbl_product where status='Active' and distributor_id='$ver'");
		while($fetch_denom1=mysqli_fetch_assoc($res_denom1))
		{
			$temp_pid=$fetch_denom1['product_id'];
			$product_detail=mysqli_query($con,"SELECT tbl_party_transaction_detail.quantity FROM tbl_party_transaction,tbl_party_transaction_detail where tbl_party_transaction.transaction_id=tbl_party_transaction_detail.transaction_id and tbl_party_transaction.transaction_date='$cdate' and tbl_party_transaction.transaction_from='$temp_uid' and tbl_party_transaction_detail.product_id='$temp_pid'");
			if(mysqli_num_rows($product_detail)>0)
			{     
				while($fetch_detail=mysqli_fetch_array($product_detail))
				{
					$temp_closing_stock=$temp_closing_stock+$fetch_detail['quantity'];
				} 
			}
			$executive[$temp_ar]=$temp_closing_stock;
			$temp_ar++;
			$temp_closing_stock=0;
		}
		$response['executive'][]=$executive;
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