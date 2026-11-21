
<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']))
{
	$ver = $_POST['distributor_id'];
	$uid = $_POST['user_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate2  = date("Y-m-d");
	$last7days=date('Y-m-d',(strtotime('-7 day',strtotime($cdate2))));
	$cdate11  = date("m");
	$cdate12  = date("Y");
	$cdate1 = $cdate12."-".$cdate11."-01";
	
	$sale_book_7days_userwise=array();
	$my_flag=0;
	$product_detail= mysqli_query($con,"SELECT product_id,product_name FROM `tbl_product` WHERE `distributor_id`='$ver' and product_name NOT IN ('Airtel Money','Idea Money','Jio Phone')");
	while($pro_fetch=mysqli_fetch_array($product_detail)) 
	{ 
		$prod_id=$pro_fetch['product_id'];
		$total_sale_qty=0;
		$res_sale1 = mysqli_query($con,"select sum(quantity) as tqty FROM tbl_party_transaction_detail where transaction_id in (select transaction_id from tbl_party_transaction where transaction_date >='$last7days' and transaction_date <='$cdate2' and transaction_from='$uid' and bill_type in ('Tax Invoice','Payout')) and product_id='$prod_id' group by product_id");
		while($fetch_product=mysqli_fetch_assoc($res_sale1))
		{
			$my_flag=1;
			$total_sale_qty=$total_sale_qty+$fetch_product['tqty'];
			$sale_book_7days_userwise['product_name']=$pro_fetch['product_name'];
			$sale_book_7days_userwise['total_qty']=$total_sale_qty;
			$response['sale_book_7days_userwise'][]=$sale_book_7days_userwise;
		}
	}
	if($my_flag==0)
	{
		$sale_book_7days_userwise['data_flag']=false;
		$response['sale_book_7days_userwise'][]=$sale_book_7days_userwise;
	}
	
	
	$sale_book_monthly_userwise=array();
	$my_flag=0;
	$product_detail= mysqli_query($con,"SELECT product_id,product_name FROM `tbl_product` WHERE `distributor_id`='$ver' and product_name NOT IN ('Airtel Money','Idea Money','Jio Phone')");
	while($pro_fetch=mysqli_fetch_array($product_detail)) 
	{ 
		$prod_id=$pro_fetch['product_id'];
		$total_sale_qty=0;
		$res_sale1 = mysqli_query($con,"select sum(quantity) as tqty FROM tbl_party_transaction_detail where transaction_id in (select transaction_id from tbl_party_transaction where transaction_date >='$cdate1' and transaction_date <='$cdate2' and transaction_from='$uid' and bill_type in ('Tax Invoice','Payout')) and product_id='$prod_id' group by product_id");
		while($fetch_product=mysqli_fetch_assoc($res_sale1))
		{
			$my_flag=1;
			$total_sale_qty=$total_sale_qty+$fetch_product['tqty'];
			$sale_book_monthly_userwise['product_name']=$pro_fetch['product_name'];
			$sale_book_monthly_userwise['total_qty']=$total_sale_qty;
			$response['sale_book_monthly_userwise'][]=$sale_book_monthly_userwise;
		}
	}
	if($my_flag==0)
	{
		$sale_book_monthly_userwise['data_flag']=false;
		$response['sale_book_monthly_userwise'][]=$sale_book_monthly_userwise;
	}
	
	$sale_book_currently_userwise=array();
	$my_flag=0;
	$product_detail= mysqli_query($con,"SELECT product_id,product_name FROM `tbl_product` WHERE `distributor_id`='$ver' and product_name NOT IN ('Airtel Money','Idea Money','Jio Phone')");
	while($pro_fetch=mysqli_fetch_array($product_detail)) 
	{ 
		$prod_id=$pro_fetch['product_id'];
		$total_sale_qty=0;
		$res_sale1 = mysqli_query($con,"select sum(quantity) as tqty FROM tbl_party_transaction_detail where transaction_id in (select transaction_id from tbl_party_transaction where transaction_date ='$cdate2' and transaction_from='$uid' and bill_type in ('Tax Invoice','Payout')) and product_id='$prod_id' group by product_id");
		while($fetch_product=mysqli_fetch_assoc($res_sale1))
		{
			$my_flag=1;
			$total_sale_qty=$total_sale_qty+$fetch_product['tqty'];
			$sale_book_currently_userwise['product_name']=$pro_fetch['product_name'];
			$sale_book_currently_userwise['total_qty']=$total_sale_qty;
			$response['sale_book_currently_userwise'][]=$sale_book_currently_userwise;
		}
	}
	if($my_flag==0)
	{
		$sale_book_currently_userwise['data_flag']=false;
		$response['sale_book_currently_userwise'][]=$sale_book_currently_userwise;
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