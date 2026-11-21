<?php
include("../../connect.php");
$response = array();
if(isset($_POST['party_id']) && isset($_POST['distributor_id']) && isset($_POST['distributor_user_id']))
{
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
	$scro = date("h:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$last_date=date('Y-m-d',(strtotime('-30 day',strtotime($da))));
	
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
	$pid=$_POST['party_id'];
	$flagData=0;
	$res_search = mysqli_query($con,"select party_name from tbl_purchase_party where distributor_id='$ver' and purchase_party_id='$pid'");
	while($fetch_psearch=mysqli_fetch_assoc($res_search))
	{
		$partyName=$fetch_psearch['party_name'];
	}
	
	$dsr_day_control=mysqli_query($con,"SELECT control_id FROM tbl_distributor_business_control where insert_date='$da' and distributor_id='$ver'"); 
	$response['dsr_day_control']='False';
	if(mysqli_num_rows($dsr_day_control)>0)
		$response['dsr_day_control']='True';
	
	$purchasebook=array();
	$res = mysqli_query($con,"select unique_bill,bill_date,transaction_date,purchase_type,message_txn_id,bill_type from tbl_distributor_transaction where distributor_id='$ver' and party_id='$pid' and bill_date>='$last_date' and bill_date<='$da' and txn_type='Add' and purchase_category!='Opening Stock' and conversion='' group by unique_bill");
	while($fetch_product=mysqli_fetch_assoc($res))
	{
		$flagData=1;
		$purchasebook['party_name']=$partyName;
		$unique_bill=$fetch_product['unique_bill'];
		$purchasebook['bill_number']=$fetch_product['unique_bill'];
		$purchasebook['bill_date']=$fetch_product['bill_date'];
		$purchasebook['bill_type']=$fetch_product['bill_type'];
		$purchasebook['transaction_date']=$fetch_product['transaction_date'];
		$purchasebook['purchase_type']=$fetch_product['purchase_type'];
		$purchasebook['message_txn_id']=$fetch_product['message_txn_id'];
		$transaction_date=$fetch_product['transaction_date'];
		
		$month_gstr_check=explode("-",$fetch_product['bill_date']);
		
		$purchasebook['distributor_gst_report']='False';
		$query_check=mysqli_query($con,"select * from tbl_distributor_gst_report where distributor_id='$ver' and year='$month_gstr_check[0]' and month='$month_gstr_check[1]'");
		if(mysqli_num_rows($query_check)>0)
			$purchasebook['distributor_gst_report']='True';
		
		$u_bill=$fetch_product['unique_bill'];
		$bill_no=$fetch_product['bill_no'];
		$purchasebook['bill_cancel_flag']='True';
		$product_return= mysqli_query($con,"SELECT * FROM `tbl_purchase_return_transaction` WHERE unique_bill='$u_bill' and bill_no='$bill_no' and party_id='$pid'");
		if(mysqli_num_rows($product_return)>0)
			$purchasebook['bill_cancel_flag']='False';
		
		$purchasebook['distributor_stock_less']='False';
		$res_detail = mysqli_query($con,"select product_id,quantity from tbl_distributor_transaction where distributor_id='$ver' and party_id='$pid' and unique_bill='$unique_bill' and txn_type='Add'");
		while($fetch_proDetail=mysqli_fetch_assoc($res_detail))
		{
			$txn_productId=$fetch_proDetail['product_id'];
			$purchaseQuantity=$fetch_proDetail['quantity'];
			
			$resstock_detail = mysqli_query($con,"select tbl_distributor_stock.closing_stock,tbl_product.product_type from tbl_distributor_stock,tbl_product where tbl_distributor_stock.product_id=tbl_product.product_id and tbl_distributor_stock.distributor_id='$ver' and tbl_distributor_stock.product_id='$txn_productId' and tbl_distributor_stock.date>='$transaction_date' and tbl_product.product_type not in ('Payout','Money Payout')");
			while($fetch_stockDetail=mysqli_fetch_assoc($resstock_detail))
			{
				$purchasebook['bill_type']=$fetch_stockDetail['product_type'];
				if($fetch_stockDetail['closing_stock']<$purchaseQuantity)
					$purchasebook['distributor_stock_less']='True';
			}
		}
		$response['purchasebook'][]=$purchasebook;
	}
	if($flagData==1)
	{
		$response['success']='1';
		$response['details']="Bill Successfully Fetch";
	}
	else
	{
		$response['success']='0';
		$response['details']="No Data Available";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);


?>