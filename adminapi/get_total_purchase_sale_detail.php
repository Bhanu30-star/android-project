
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
	$cdate2  = date("Y-m-d");
	$last7days=date('Y-m-d',(strtotime('-7 day',strtotime($cdate2))));
	$cdate11  = date("m");
	$cdate12  = date("Y");
	$cdate1 = $cdate12."-".$cdate11."-01";
	
	$sale_book_7days=array();
	$my_flag=0;
	$product_detail= mysqli_query($con,"SELECT product_id,product_name FROM `tbl_product` WHERE `distributor_id`='$ver' and product_name NOT IN ('Airtel Money','Idea Money','Jio Phone')");
	while($pro_fetch=mysqli_fetch_array($product_detail)) 
	{ 
		$prod_id=$pro_fetch['product_id'];
		$total_sale_qty=0;
		$res_sale1 = mysqli_query($con,"select sum(quantity) as tqty FROM tbl_party_transaction_detail where transaction_id in (select transaction_id from tbl_party_transaction where transaction_from in (select user_id from tbl_user where distributor_id = '$ver') and transaction_date >='$last7days' and transaction_date <='$cdate2' and bill_type in ('Tax Invoice','Payout')) and product_id='$prod_id' group by product_id");
		while($fetch_product=mysqli_fetch_assoc($res_sale1))
		{
			$my_flag=1;
			$total_sale_qty=$total_sale_qty+$fetch_product['tqty'];
			$sale_book_7days['product_name']=$pro_fetch['product_name'];
			$sale_book_7days['total_qty']=$total_sale_qty;
			$response['sale_book_7days'][]=$sale_book_7days;
		}
	}
	if($my_flag==0)
	{
		$sale_book_7days['data_flag']=false;
		$response['sale_book_7days'][]=$sale_book_7days;
	}

	$sale_book_currently=array();
	$my_flag=0;
	$product_detail= mysqli_query($con,"SELECT product_id,product_name FROM `tbl_product` WHERE `distributor_id`='$ver' and product_name NOT IN ('Airtel Money','Idea Money','Jio Phone')");
	while($pro_fetch=mysqli_fetch_array($product_detail)) 
	{ 
		$prod_id=$pro_fetch['product_id'];
		$total_sale_qty=0;
		$res_sale1 = mysqli_query($con,"select sum(quantity) as tqty FROM tbl_party_transaction_detail where transaction_id in (select transaction_id from tbl_party_transaction where transaction_from in (select user_id from tbl_user where distributor_id = '$ver') and  transaction_date ='$cdate2' and bill_type in ('Tax Invoice','Payout')) and product_id='$prod_id' group by product_id");
		while($fetch_product=mysqli_fetch_assoc($res_sale1))
		{
			$my_flag=1;
			$total_sale_qty=$total_sale_qty+$fetch_product['tqty'];
			$sale_book_currently['product_name']=$pro_fetch['product_name'];
			$sale_book_currently['total_qty']=$total_sale_qty;
			$response['sale_book_currently'][]=$sale_book_currently;
		}
	}
	if($my_flag==0)
	{
		$sale_book_currently['data_flag']=false;
		$response['sale_book_currently'][]=$sale_book_currently;
	}
	
	
	$sale_book_monthly=array();
	$my_flag=0;
	$product_detail= mysqli_query($con,"SELECT product_id,product_name FROM `tbl_product` WHERE `distributor_id`='$ver' and product_name NOT IN ('Airtel Money','Idea Money','Jio Phone')");
	while($pro_fetch=mysqli_fetch_array($product_detail)) 
	{ 
		$prod_id=$pro_fetch['product_id'];
		$total_sale_qty=0;
		$res_sale1 = mysqli_query($con,"select sum(quantity) as tqty FROM tbl_party_transaction_detail where transaction_id in (select transaction_id from tbl_party_transaction where transaction_from in (select user_id from tbl_user where distributor_id = '$ver') and transaction_date >='$cdate1' and transaction_date <='$cdate2' and bill_type in ('Tax Invoice','Payout')) and product_id='$prod_id' group by product_id");
		while($fetch_product=mysqli_fetch_assoc($res_sale1))
		{
			$my_flag=1;
			$total_sale_qty=$total_sale_qty+$fetch_product['tqty'];
			$sale_book_monthly['product_name']=$pro_fetch['product_name'];
			$sale_book_monthly['total_qty']=$total_sale_qty;
			$response['sale_book_monthly'][]=$sale_book_monthly;
		}
	}
	if($my_flag==0)
	{
		$sale_book_monthly['data_flag']=false;
		$response['sale_book_monthly'][]=$sale_book_monthly;
	}
	
	$my_flag=0;
	$purchase_book_monthly=array();
	$product_detail= mysqli_query($con,"SELECT product_id,product_name FROM `tbl_product` WHERE `distributor_id`='$ver' and product_name NOT IN ('Airtel Money','Idea Money','Jio Phone')");
	while($pro_fetch=mysqli_fetch_array($product_detail)) 
	{ 
		$prod_id=$pro_fetch['product_id'];
		$total_purchase_qty=0;
		$query_purchase1=mysqli_query($con,"select quantity,transaction_id from tbl_distributor_transaction where distributor_id='$ver' and bill_date>='$cdate1' and bill_date<='$cdate2' and txn_type='Add' and tbl_distributor_transaction.conversion='' and product_id='$prod_id'");
		while($fetch_product=mysqli_fetch_assoc($query_purchase1))
		{
			$total_purchase_qty=$total_purchase_qty+$fetch_product['quantity'];
			$temp_txn_id=$fetch_product['transaction_id'];
			$product_return= mysqli_query($con,"SELECT return_quantity FROM `tbl_purchase_return_transaction` WHERE `transaction_id`='$temp_txn_id'");
			while($pro_fetch_return=mysqli_fetch_array($product_return)) 
			{ 
				$total_purchase_qty=$total_purchase_qty-round($pro_fetch_return['return_quantity'],2);
			}
		}
		if($total_purchase_qty>0)
		{
			$my_flag=1;
			$purchase_book_monthly['product_name']=$pro_fetch['product_name'];
			$purchase_book_monthly['total_qty']=$total_purchase_qty;
			$response['purchase_book_monthly'][]=$purchase_book_monthly;
		}
	}
	if($my_flag==0)
	{
		$purchase_book_monthly['data_flag']=false;
		$response['purchase_book_monthly'][]=$purchase_book_monthly;
	}
	
	
	$my_flag=0;
	$purchase_book_currently=array();
	$product_detail= mysqli_query($con,"SELECT product_id,product_name FROM `tbl_product` WHERE `distributor_id`='$ver' and product_name NOT IN ('Airtel Money','Idea Money','Jio Phone')");
	while($pro_fetch=mysqli_fetch_array($product_detail)) 
	{ 
		$prod_id=$pro_fetch['product_id'];
		$total_purchase_qty=0;
		$query_purchase1=mysqli_query($con,"select quantity,transaction_id from tbl_distributor_transaction where distributor_id='$ver' and bill_date='$cdate2' and txn_type='Add' and tbl_distributor_transaction.conversion='' and product_id='$prod_id'");
		while($fetch_product=mysqli_fetch_assoc($query_purchase1))
		{
			$total_purchase_qty=$total_purchase_qty+$fetch_product['quantity'];
			$temp_txn_id=$fetch_product['transaction_id'];
			$product_return= mysqli_query($con,"SELECT return_quantity FROM `tbl_purchase_return_transaction` WHERE `transaction_id`='$temp_txn_id'");
			while($pro_fetch_return=mysqli_fetch_array($product_return)) 
			{ 
				$total_purchase_qty=$total_purchase_qty-round($pro_fetch_return['return_quantity'],2);
			}
		}
		if($total_purchase_qty>0)
		{
			$my_flag=1;
			$purchase_book_currently['product_name']=$pro_fetch['product_name'];
			$purchase_book_currently['total_qty']=$total_purchase_qty;
			$response['purchase_book_currently'][]=$purchase_book_currently;
		}
	}
	if($my_flag==0)
	{
		$purchase_book_currently['data_flag']=false;
		$response['purchase_book_currently'][]=$purchase_book_currently;
	}
	
	
	$my_flag=0;
	$purchase_book_7days=array();
	$product_detail= mysqli_query($con,"SELECT product_id,product_name FROM `tbl_product` WHERE `distributor_id`='$ver' and product_name NOT IN ('Airtel Money','Idea Money','Jio Phone')");
	while($pro_fetch=mysqli_fetch_array($product_detail)) 
	{ 
		$prod_id=$pro_fetch['product_id'];
		$total_purchase_qty=0;
		$query_purchase1=mysqli_query($con,"select quantity,transaction_id from tbl_distributor_transaction where distributor_id='$ver' and bill_date>='$last7days' and bill_date<='$cdate2' and txn_type='Add' and tbl_distributor_transaction.conversion='' and product_id='$prod_id'");
		while($fetch_product=mysqli_fetch_assoc($query_purchase1))
		{
			$total_purchase_qty=$total_purchase_qty+$fetch_product['quantity'];
			$temp_txn_id=$fetch_product['transaction_id'];
			$product_return= mysqli_query($con,"SELECT return_quantity FROM `tbl_purchase_return_transaction` WHERE `transaction_id`='$temp_txn_id'");
			while($pro_fetch_return=mysqli_fetch_array($product_return)) 
			{ 
				$total_purchase_qty=$total_purchase_qty-round($pro_fetch_return['return_quantity'],2);
			}
		}
		if($total_purchase_qty>0)
		{
			$my_flag=1;
			$purchase_book_7days['product_name']=$pro_fetch['product_name'];
			$purchase_book_7days['total_qty']=$total_purchase_qty;
			$response['purchase_book_7days'][]=$purchase_book_7days;
		}
	}
	if($my_flag==0)
	{
		$purchase_book_7days['data_flag']=false;
		$response['purchase_book_7days'][]=$purchase_book_7days;
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