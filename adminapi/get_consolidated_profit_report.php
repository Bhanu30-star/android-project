<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['monthname']) && isset($_POST['yearname']))
{
	$monthname=$_POST['monthname'];
	$yearname=$_POST['yearname'];
	$session_dist_ver = $_POST['distributor_id'];
	
	$cdate1 = $yearname."-".$monthname."-01";
	$cdate2 = $yearname."-".$monthname."-28";
	$cdate2=date("Y-m-t", strtotime($cdate2));
	$dayend=date("t",strtotime($cdate2));
	
	$product=array();
	$total_bill_amt= $total_cost_amt = $total_profit = $c= 0;
	for($nm=1;$nm<=$dayend;$nm++) 
	{
		$curdate=date("Y-m-d", strtotime($yearname."-".$monthname."-".$nm));
		$sale_amount=$purchase_amount=$sale_qty=0;
		$res = mysqli_query($con,"select *,tbl_product.product_price as proprice from tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id= tbl_product.product_id and tbl_product.distributor_id='$session_dist_ver' and tbl_product.product_type not in ('BRANDING') and transaction_id in (SELECT transaction_id FROM `tbl_party_transaction` where transaction_date='$curdate')");
		if(mysqli_num_rows($res)>0)
		{    
			$c++;
			while($fetch_product2=mysqli_fetch_assoc($res))
			{
				$sale_qty=$sale_qty+$fetch_product2['quantity'];
				$sale_amount=$sale_amount+$fetch_product2['quantity']*$fetch_product2['proprice'];
				$purchase_amount=$purchase_amount+$fetch_product2['quantity']*$fetch_product2['purchase_price'];
			}
			$product['date']=$curdate;
			$product['sale_qty']=round($sale_qty,2);
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