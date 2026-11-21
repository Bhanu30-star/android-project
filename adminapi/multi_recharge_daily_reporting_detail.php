<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']))
{
	$dis_id = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$dis_id'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$da  = date("Y-m-d");
	$response['opening_stock'] = $response['closing_stock'] = $response['total_purchase']=0;
	$opening_detail=mysqli_query($con,"select * from tbl_distributor_stock where distributor_id='$dis_id' and date<='$da' and product_id in (select product_id from tbl_product where product_category='Multi Recharge' and status='Active') order by date desc limit 1");
	while($fetch_data=mysqli_fetch_array($opening_detail))
	{	
		$pro_id = $fetch_data['product_id'];
		$response['opening_stock'] = $fetch_data['opening_stock'];
		$response['closing_stock'] = $fetch_data['closing_stock'];
	}
	$res_purchase = mysqli_query($con,"select sum(final_net_amt) as total_purchase from tbl_distributor_transaction where distributor_id='$dis_id' and bill_date='$da' and tbl_distributor_transaction.operator_detail!=''");
	while($fetch_purchase=mysqli_fetch_array($res_purchase))
	{	
		$response['total_purchase'] = $fetch_purchase['total_purchase'];
	}
	
	$res_sale = mysqli_query($con,"select sum(final_amt) as total_sale from tbl_party_transaction where transaction_date='$da' and bill_type ='Tax Invoice' and operator_detail!='' and transaction_from in (select user_id from tbl_user where `distributor_id` = '$dis_id')");
	while($fetch_sale=mysqli_fetch_array($res_sale))
	{	
		$response['total_sale'] = $fetch_sale['total_sale'];
	}
	
	
	$res_sale_operator = mysqli_query($con,"select sum(final_amt) as total_sale,operator_detail from tbl_party_transaction where transaction_date='$da' and bill_type ='Tax Invoice' and operator_detail!='' and transaction_from in (select user_id from tbl_user where `distributor_id` = '$dis_id') group by operator_detail");
	$operator_wise_detail=array();
	if(mysqli_num_rows($res_sale_operator)>0)
	{
		while($fetch_sale=mysqli_fetch_array($res_sale_operator))
		{	
			$operator_wise_detail['operator_name']=$fetch_sale['operator_detail'];
			$operator_wise_detail['sale_amount']=$fetch_sale['total_sale'];
			$response['operator_wise_detail'][]=$operator_wise_detail;
		}
	}
	else
	{
		$response['operator_wise_detail']=$operator_wise_detail;
	}
	
	$response['success']='1';
	$response['message']="Fetch Detail Successful";
}
else
{
	$response['success']='0';
	$response['details']="Required Field Missing";
}	
echo json_encode($response);
?>