<?php
include("../../connect.php");
$response = array();
if(isset($_POST['product_order_json']) && isset($_POST['distributor_id']))
{
	$session_dist_ver=$_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$da  = date("Y-m-d")." ".date('H:i:sa');
	$scri=date('H:i:sa');
	$toder = $_POST['product_order_json'];
	$json_a=json_decode($toder, true);     
	foreach ($json_a as $fetch_product11)
	{
		$txn_id=$fetch_product11['transaction_id'];
		$res11 = mysqli_query($con,"select * from tbl_distributor_transaction where distributor_id='$session_dist_ver' and transaction_id='$txn_id'");
		while($fetch_product11=mysqli_fetch_assoc($res11))
		{
			$set_quan=$fetch_product11['quantity'];
			$proid=$fetch_product11['product_id'];
			$cdate=$fetch_product11['transaction_date'];
			
			$uq=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=round(stock_quantity-'$set_quan',2),tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$session_dist_ver'");
			$uq1=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock-'$set_quan',2) where date ='$cdate' and distributor_id='$session_dist_ver' and product_id='$proid'");	
			$uq2=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock-'$set_quan',2), opening_stock=round(opening_stock-'$set_quan',2) where date>'$cdate' and distributor_id='$session_dist_ver' and product_id='$proid'");
			$txn_delete=mysqli_query($con,"delete from tbl_distributor_transaction where product_id='$proid' and distributor_id='$session_dist_ver' and transaction_id='$txn_id'");
		}	
	}			
	$response['success']='1';
	$response['details']="Business Stock Successfully Deleted...!!";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>