<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['start_date']) && isset($_POST['end_date']))
{
	$session_dist_ver=$_POST['distributor_id'];
	$cdate1=$_POST['start_date'];
	$cdate2=$_POST['end_date'];
	$summary_detail=array();
	$total_bill_amt=0;
	$res_product = mysqli_query($con,"select *,tbl_product_profit_daywise.purchase_price as pur_price from tbl_product_profit_daywise, tbl_product where tbl_product_profit_daywise.product_id = tbl_product.product_id and tbl_product.distributor_id = '$session_dist_ver' and tbl_product_profit_daywise.date>='$cdate1' and tbl_product_profit_daywise.date<='$cdate2' order by tbl_product_profit_daywise.id ASC");
	if(mysqli_num_rows($res_product)>0)
	{
		while($fetch_pro_data=mysqli_fetch_assoc($res_product))
		{
			$total_bill_amt=$total_bill_amt+$fetch_pro_data['total_profit'];
			$summary_detail['product_id']=$fetch_pro_data['product_id'];
			$summary_detail['product_name']=$fetch_pro_data['product_name'];
			$summary_detail['date']=$fetch_pro_data['date'];
			$summary_detail['product_type']=$fetch_pro_data['product_type'];
			$summary_detail['txn_type']=$fetch_pro_data['type'];
			$summary_detail['qty']=$fetch_pro_data['qty'];
			$summary_detail['sale_price']=$fetch_pro_data['sale_price'];
			$summary_detail['pur_price']=$fetch_pro_data['pur_price'];
			$summary_detail['avg_price']=$fetch_pro_data['avg_price'];
			$summary_detail['balance_qty']=$fetch_pro_data['balance_qty'];
			$summary_detail['profit_loss_per_qty']=$fetch_pro_data['profit_loss_per_qty'];
			$summary_detail['total_profit']=$fetch_pro_data['total_profit'];
			$response['summary_detail'][]=$summary_detail;
		}
	}
	else
	{
		$response['summary_detail']=$summary_detail;
	}
	$response['total_profit_amt']=strval($total_bill_amt);
	$response['success']='1';
	$response['details']="Fetch Detail Successful";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing!!";
}	
mysqli_close($con);
echo json_encode($response);
?>