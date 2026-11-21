<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['bill_txn_id']))
{
	$txnid = $_POST['bill_txn_id'];
	$session_dist_ver = $_POST['distributor_id'];
	
	$product=array();
	$total_bill_amt= $total_cost_amt = $total_profit =$c= 0;
	$res_detail = mysqli_query($con,"select *,tbl_product.product_price as proprice from tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id = tbl_product.product_id and tbl_product.distributor_id='$session_dist_ver' and tbl_product.product_type not in ('BRANDING') and transaction_id ='$txnid'");
	while($fetch_data=mysqli_fetch_assoc($res_detail))
	{
		$c++;
		$sale_amount=$purchase_amount=0;
		$sale_amount=$fetch_data['quantity']*$fetch_data['proprice'];
		$purchase_amount=$fetch_data['quantity']*$fetch_data['purchase_price'];
		
		$product['product_name']=$fetch_data['product_name'];
		$product['sale_qty']=$fetch_data['quantity'];
		$product['sale_amount']=round($sale_amount,2);
		$product['purchase_amount']=round($purchase_amount,2);
		$product['gross_profit']=round($sale_amount-$purchase_amount,2);
		$product['profit']=round((($sale_amount-$purchase_amount)*100)/$purchase_amount,2);
			
		$response['profit_detail'][]=$product;
			
		$total_bill_amt=$total_bill_amt+round($sale_amount,2); 
		$total_cost_amt=$total_cost_amt+round($purchase_amount,2); 
		$total_profit=$total_profit+round($sale_amount-$purchase_amount,2);
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