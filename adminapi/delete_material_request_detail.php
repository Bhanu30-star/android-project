<?php
include("../../connect.php");
$response = array();
if(isset($_POST['txn_id']) && isset($_POST['distributor_id']))
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
	$scro = date("h:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$bid=$_POST['bill_no'];
	$uid=$_POST['unique_bill'];
	if($bid!='' && $uid!='')
	{
		$res_bill_query = mysqli_query($con,"select * from tbl_distributor_material_transfer where distributor_id='$session_dist_ver' and status='Pending' and transfer_bill_no='$bid' and unique_bill='$uid'");
		if(mysqli_num_rows($res_bill_query)>0)
		{
			while($fetch_data=mysqli_fetch_assoc($res_bill_query))
			{
				$prodid=$fetch_data['product_id'];
				$quantity=$fetch_data['quantity'];
				$da=$fetch_data['transaction_date'];
				$uq=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock+'$quantity',2),time='$scro' where date ='$da' and distributor_id='$session_dist_ver' and product_id='$prodid'");
				$uq1=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock+'$quantity',2),time='$scro', opening_stock = round(opening_stock+'$quantity',2) where date >'$da' and distributor_id='$session_dist_ver' and product_id='$prodid'");
				$uq_product=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=round(stock_quantity+'$quantity',2),tb_updatedatetime='$scro' where product_id='$prodid' and distributor_id='$session_dist_ver'");								
			}
			$query2=mysqli_query($con,"update tbl_distributor_material_transfer set status='Deleted' WHERE distributor_id='$session_dist_ver' and status='Pending' and transfer_bill_no='$bid' and unique_bill='$uid'");
			$response['success']='1';
			$response['details']="Material Request Successfully Deleted";
		}
		else
		{
			$response['success']='0';
			$response['details']="Request Detail Not Correct";
		}
	}
	else
	{
		$response['success']='0';
		$response['details']="Bill Detail Missing";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>