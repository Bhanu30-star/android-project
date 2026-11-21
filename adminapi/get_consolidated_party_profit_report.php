<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['cdate']))
{
	$cdate1 = $_POST['cdate'];
	$session_dist_ver = $_POST['distributor_id'];
	
	$product=array();
	$total_bill_amt= $total_cost_amt = $total_profit = $c= 0;
	$res = mysqli_query($con,"select * from tbl_party_transaction,tbl_party where tbl_party_transaction.transaction_to = tbl_party.party_id and tbl_party_transaction.transaction_date='$cdate1' and tbl_party.distributor_id='$session_dist_ver' order by tbl_party_transaction.id DESC");
	if(mysqli_num_rows($res)>0)
	{    
		$c++;
		while($fetch_product2=mysqli_fetch_assoc($res))
		{
			$sale_amount=$purchase_amount=$sale_qty=0;
			$txn_id=$fetch_product2['transaction_id'];
			$res_detail = mysqli_query($con,"select *,tbl_product.product_price as proprice from tbl_party_transaction_detail, tbl_product where tbl_party_transaction_detail.product_id = tbl_product.product_id and tbl_product.distributor_id='$session_dist_ver' and tbl_product.product_type not in ('BRANDING') and transaction_id ='$txn_id'");
			while($fetch_data=mysqli_fetch_assoc($res_detail))
			{
				$sale_amount=$sale_amount+$fetch_data['quantity']*$fetch_data['proprice'];
				$purchase_amount=$purchase_amount+$fetch_data['quantity']*$fetch_data['purchase_price'];
			}
			$product['date']=$cdate1;
			$product['bill_txn_id']=$txn_id;
			$product['bill_no']=$fetch_product2['transaction_bill_number'];
			$product['party_detail']=$fetch_product2['party_name'].'-'.$fetch_product2['party_phone'];
			$product['sale_amount']=round($sale_amount,2);
			$product['purchase_amount']=round($purchase_amount,2);
			$product['gross_profit']=round($sale_amount-$purchase_amount,2);
			$product['profit']=round((($sale_amount-$purchase_amount)*100)/$purchase_amount,2);
			
			$response['profit_detail'][]=$product;
			
			$total_bill_amt=$total_bill_amt+round($sale_amount,2); 
			$total_cost_amt=$total_cost_amt+round($purchase_amount,2); 
			$total_profit=$total_profit+round($sale_amount-$purchase_amount,2);
		}
	}
	
	$response['total_bill_amt']=$total_bill_amt;
	$response['total_cost_amt']=$total_cost_amt;
	$response['total_profit_amt']=$total_profit;
	
	if($c>0)
	{
		$response['success']='1';
		$response['details']="Fetch Detail Successful";
	}
	else
	{
		$response['profit_detail']=$product;
		$response['success']='1';
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