<?php
include("../../connect.php");
$response = array();
if(isset($_POST['unique_bill']) && isset($_POST['party_id']) && isset($_POST['distributor_id']))
{
	$uid=$_POST['unique_bill'];
	$ver=$_POST['distributor_id'];
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
	$id1=$_POST['party_id'];
	$res_detail = mysqli_query($con,"select * from tbl_distributor_transaction where distributor_id='$ver' and party_id='$id1' and unique_bill='$uid' and txn_type='Add'");
	while($fetch_proDetail=mysqli_fetch_assoc($res_detail))
	{
		$pro_id=$fetch_proDetail['product_id'];
		$pro_quantity=$fetch_proDetail['quantity'];
		$transaction_date=$fetch_proDetail['transaction_date'];
		$st_query1 = mysqli_query($con,"INSERT IGNORE INTO `tbl_purchase_bill_cancel` (`transaction_id`, `product_id`, `distributor_id`, `user_id`, `quantity`, `transaction_date`, `transaction_time`, `txn_type`, `total_amount`, `cgst_amt`, `sgst_amt`, `party_id`, `bill_no`, `unique_bill`, `bill_date`, `bill_time`, `insert_datetime`,`action_by`,`conversion`,`remark_detail`,`igst_amt`,`product_price`,`purchase_type`,`message_txn_id`) VALUES('".$fetch_proDetail['transaction_id']."','".$fetch_proDetail['product_id']."','".$fetch_proDetail['distributor_id']."','".$fetch_proDetail['user_id']."','".$fetch_proDetail['quantity']."','".$fetch_proDetail['transaction_date']."','".$fetch_proDetail['transaction_time']."','".$fetch_proDetail['txn_type']."','".$fetch_proDetail['total_amount']."','".$fetch_proDetail['cgst_amt']."','".$fetch_proDetail['sgst_amt']."','".$fetch_proDetail['party_id']."','".$fetch_proDetail['bill_no']."','".$fetch_proDetail['unique_bill']."','".$fetch_proDetail['bill_date']."','".$fetch_proDetail['bill_time']."','$scri','$dis_user_id','".$fetch_proDetail['conversion']."','".$fetch_proDetail['remark_detail']."','".$fetch_proDetail['igst_amt']."','".$fetch_proDetail['product_price']."','".$fetch_proDetail['purchase_type']."','".$fetch_proDetail['message_txn_id']."')");
	
		$res_productdetail = mysqli_query($con,"select * from tbl_product where distributor_id='$ver' and product_id='$pro_id' and product_type not in ('Payout','Money Payout')");
		while($fetch_productDetail=mysqli_fetch_assoc($res_productdetail))
		{
			$final_stock_quantity=$fetch_productDetail['stock_quantity']-$pro_quantity;
			$uq2=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$final_stock_quantity'  where distributor_id='$ver' and product_id='$pro_id'");
			$check_i=0;
			$res_des_detail = mysqli_query($con,"select closing_stock,date,opening_stock from tbl_distributor_stock where distributor_id='$ver' and product_id='$pro_id' and date>='$transaction_date' order by tbl_distributor_stock.date desc limit 1");
			while($stock_desDetail=mysqli_fetch_assoc($res_des_detail))
			{
				$final_stock_detail=round($stock_desDetail['closing_stock']-$pro_quantity,2);
				$bill_txn_date=$stock_desDetail['date'];
				if($check_i==0)
				{
					$uq1=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock='$final_stock_detail' where distributor_id='$ver' and product_id='$pro_id' and date='$bill_txn_date'");
				}
				else
				{
					$opening_stock_detail=$stock_desDetail['opening_stock']-$pro_quantity;
					$uq1=mysqli_query($con,"UPDATE tbl_distributor_stock SET opening_stock='$opening_stock_detail',closing_stock='$final_stock_detail' where distributor_id='$ver' and product_id='$pro_id' and date='$bill_txn_date'");
					
				}
				$check_i=$check_i+1;
			}
		}
	}
	if($st_query1)
	{
		$resd1 = mysqli_query($con,"DELETE FROM tbl_distributor_transaction where distributor_id='$ver' and party_id='$id1' and unique_bill='$uid' and txn_type='Add'");
	}
	if($resd1)
	{
		$response['success']='1';
		$response['details']="Bill Successfully Cancelled";
	}
	else
	{
		$response['success']='0';
		$response['details']="Bill Not Cancelled";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>