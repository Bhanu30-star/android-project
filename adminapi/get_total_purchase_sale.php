
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

	$total_sale_current=0;
	$total_purchase_current=0;
	$sale_last7days=0;
	$purchase_last7days=0;
	$total_sale_month=0;
	$total_purchase_month=0;
	
	$res_sale1 = mysqli_query($con,"select tbl_party_transaction.final_amt from tbl_party_transaction,tbl_party,tbl_user where tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_party_transaction.transaction_from=tbl_user.user_id and tbl_party_transaction.transaction_date>='$cdate1' and tbl_party_transaction.transaction_date<='$cdate2' and tbl_user.distributor_id='$ver' and tbl_party_transaction.bill_type in ('Tax Invoice','Payout') order by id ASC");
	if(mysqli_num_rows($res_sale1)>0)
	{     
		$response['total_month_sale_bills']=mysqli_num_rows($res_sale1);
		while($fetch_product=mysqli_fetch_assoc($res_sale1))
		{
			$total_sale_month=$total_sale_month+$fetch_product['final_amt'];
		}
	}
	else
		$response['total_month_sale_bills']=0;
	$res_sale2 = mysqli_query($con,"select tbl_party_transaction.final_amt from tbl_party_transaction,tbl_party,tbl_user where tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_party_transaction.transaction_from=tbl_user.user_id and tbl_party_transaction.transaction_date>='$last7days' and tbl_party_transaction.transaction_date<='$cdate2' and tbl_user.distributor_id='$ver' and tbl_party_transaction.bill_type in ('Tax Invoice','Payout') order by id ASC");
	if(mysqli_num_rows($res_sale2)>0)
	{     
		$response['total_7days_sale_bills']=mysqli_num_rows($res_sale2);
		while($fetch_product=mysqli_fetch_assoc($res_sale2))
		{
			$sale_last7days=$sale_last7days+$fetch_product['final_amt'];
		}
	}
	else
		$response['total_7days_sale_bills']=0;
	$res_sale3 = mysqli_query($con,"select tbl_party_transaction.final_amt from tbl_party_transaction,tbl_party,tbl_user where tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_party_transaction.transaction_from=tbl_user.user_id and tbl_party_transaction.transaction_date='$cdate2' and tbl_user.distributor_id='$ver' and tbl_party_transaction.bill_type in ('Tax Invoice','Payout') order by id ASC");
	if(mysqli_num_rows($res_sale3)>0)
	{     
		$response['total_current_sale_bills']=mysqli_num_rows($res_sale3);
		while($fetch_product=mysqli_fetch_assoc($res_sale3))
		{
			$total_sale_current=$total_sale_current+$fetch_product['final_amt'];
		}
	}	
	else
		$response['total_current_sale_bills']=0;
	$response['total_month_purchase_bills']=0;
	$query_purchase1=mysqli_query($con,"select tbl_distributor_transaction.final_net_amt,tbl_distributor_transaction.transaction_id from tbl_distributor_transaction,tbl_product where tbl_distributor_transaction.product_id=tbl_product.product_id and tbl_distributor_transaction.distributor_id='$ver' and tbl_distributor_transaction.bill_date>='$cdate1' and tbl_distributor_transaction.bill_date<='$cdate2' and tbl_distributor_transaction.txn_type='Add' and tbl_distributor_transaction.conversion='' and tbl_product.product_name NOT IN ('Airtel Money','Idea Money','Jio Phone') group by tbl_distributor_transaction.unique_bill");
	if(mysqli_num_rows($query_purchase1)>0)
	{     
		$response['total_month_purchase_bills']=mysqli_num_rows($query_purchase1);
	}	
	
	$query_purchase1=mysqli_query($con,"select tbl_distributor_transaction.final_net_amt,tbl_distributor_transaction.transaction_id from tbl_distributor_transaction,tbl_product where tbl_distributor_transaction.product_id=tbl_product.product_id and tbl_distributor_transaction.distributor_id='$ver' and tbl_distributor_transaction.bill_date>='$cdate1' and tbl_distributor_transaction.bill_date<='$cdate2' and tbl_distributor_transaction.txn_type='Add' and tbl_distributor_transaction.conversion='' and tbl_product.product_name NOT IN ('Airtel Money','Idea Money','Jio Phone') order by tbl_distributor_transaction.id ASC");
	if(mysqli_num_rows($query_purchase1)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($query_purchase1))
		{
			$total_purchase_month=$total_purchase_month+round($fetch_product['final_net_amt'],2);
			$temp_txn_id=$fetch_product['transaction_id'];
			$product_return= mysqli_query($con,"SELECT * FROM `tbl_purchase_return_transaction` WHERE `transaction_id`='$temp_txn_id'");
			while($pro_fetch_return=mysqli_fetch_array($product_return)) 
			{ 
				$total_purchase_month=$total_purchase_month-round($pro_fetch_return['return_net_amt'],2);
			}
		}
	}	
	$response['total_7days_purchase_bills']=0;
	$query_purchase2=mysqli_query($con,"select tbl_distributor_transaction.final_net_amt,tbl_distributor_transaction.transaction_id from tbl_distributor_transaction,tbl_product where tbl_distributor_transaction.product_id=tbl_product.product_id and tbl_distributor_transaction.distributor_id='$ver' and tbl_distributor_transaction.bill_date>='$last7days' and tbl_distributor_transaction.bill_date<='$cdate2' and tbl_distributor_transaction.txn_type='Add' and tbl_distributor_transaction.conversion='' and tbl_product.product_name NOT IN ('Airtel Money','Idea Money','Jio Phone') group by tbl_distributor_transaction.unique_bill");
	if(mysqli_num_rows($query_purchase2)>0)
	{     
		$response['total_7days_purchase_bills']=mysqli_num_rows($query_purchase2);
	}	
	
	$query_purchase2=mysqli_query($con,"select tbl_distributor_transaction.final_net_amt,tbl_distributor_transaction.transaction_id from tbl_distributor_transaction,tbl_product where tbl_distributor_transaction.product_id=tbl_product.product_id and tbl_distributor_transaction.distributor_id='$ver' and tbl_distributor_transaction.bill_date>='$last7days' and tbl_distributor_transaction.bill_date<='$cdate2' and tbl_distributor_transaction.txn_type='Add' and tbl_distributor_transaction.conversion='' and tbl_product.product_name NOT IN ('Airtel Money','Idea Money','Jio Phone') order by tbl_distributor_transaction.id ASC");
	if(mysqli_num_rows($query_purchase2)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($query_purchase2))
		{
			$purchase_last7days=$purchase_last7days+round($fetch_product['final_net_amt'],2);
			$temp_txn_id=$fetch_product['transaction_id'];
			$product_return= mysqli_query($con,"SELECT * FROM `tbl_purchase_return_transaction` WHERE `transaction_id`='$temp_txn_id'");
			while($pro_fetch_return=mysqli_fetch_array($product_return)) 
			{ 
				$purchase_last7days=$purchase_last7days-round($pro_fetch_return['return_net_amt'],2);
			}
		}
	}	
	$response['total_current_purchase_bills']=0;
	$query_purchase3=mysqli_query($con,"select tbl_distributor_transaction.final_net_amt,tbl_distributor_transaction.transaction_id from tbl_distributor_transaction,tbl_product where tbl_distributor_transaction.product_id=tbl_product.product_id and tbl_distributor_transaction.distributor_id='$ver' and tbl_distributor_transaction.bill_date='$cdate2' and tbl_distributor_transaction.txn_type='Add' and tbl_distributor_transaction.conversion='' and tbl_product.product_name NOT IN ('Airtel Money','Idea Money','Jio Phone') group by tbl_distributor_transaction.unique_bill");
	if(mysqli_num_rows($query_purchase3)>0)
	{     
		$response['total_current_purchase_bills']=mysqli_num_rows($query_purchase3);
	}	
	
	$query_purchase3=mysqli_query($con,"select tbl_distributor_transaction.final_net_amt,tbl_distributor_transaction.transaction_id from tbl_distributor_transaction,tbl_product where tbl_distributor_transaction.product_id=tbl_product.product_id and tbl_distributor_transaction.distributor_id='$ver' and tbl_distributor_transaction.bill_date='$cdate2' and tbl_distributor_transaction.txn_type='Add' and tbl_distributor_transaction.conversion='' and tbl_product.product_name NOT IN ('Airtel Money','Idea Money','Jio Phone') order by tbl_distributor_transaction.id ASC");
	if(mysqli_num_rows($query_purchase3)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($query_purchase3))
		{
			$total_purchase_current=$total_purchase_current+round($fetch_product['final_net_amt'],2);
			$temp_txn_id=$fetch_product['transaction_id'];
			$product_return= mysqli_query($con,"SELECT * FROM `tbl_purchase_return_transaction` WHERE `transaction_id`='$temp_txn_id'");
			while($pro_fetch_return=mysqli_fetch_array($product_return)) 
			{ 
				$total_purchase_current=$total_purchase_current-round($pro_fetch_return['return_net_amt'],2);
			}
		}
	}		
	
	$response['total_sale_current']=strval($total_sale_current);
	$response['sale_last7days']=strval($sale_last7days);
	$response['total_sale_month']=strval($total_sale_month);
	$response['total_purchase_month']=strval($total_purchase_month);
	$response['purchase_last7days']=strval($purchase_last7days);
	$response['total_purchase_current']=strval($total_purchase_current);
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