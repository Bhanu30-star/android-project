<?php
include("../../connect.php");
$response = array();
if(isset($_POST['bill_no']) && isset($_POST['distributor_id']) && isset($_POST['unique_bill']))
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
	$cdate=date("Y-m-d");
	$scri=date('H:i:sa');	
	$uid=$_POST['unique_bill'];
	$bid=$_POST['bill_no'];
	$p_id=$_POST['party_id'];
	$rec_id=$_POST['debit_note_receipt'];
	$get_total_amt=0;
	$res11 = mysqli_query($con,"SELECT * FROM `tbl_purchase_return_transaction` where distributor_id='$session_dist_ver' and bill_no='$bid' and party_id='$p_id' and unique_bill='$uid' and debit_note_receipt='$rec_id' and insert_datetime like '%$cdate%'");
	while($fetch_val=mysqli_fetch_assoc($res11))
	{
		$proid=$fetch_val['product_id'];
		$temp_quantity=$fetch_val['return_quantity']+$fetch_val['return_free_qty'];
		$get_total_amt=$get_total_amt+$fetch_val['return_net_amt'];
		$query_insert = mysqli_query($con,"INSERT INTO `tbl_purchase_return_transaction_history`(`transaction_id`, `product_id`, `product_price`, `distributor_id`, `old_quantity`, `old_total_Amount`, `old_cgst`, `old_sgst`, `return_quantity`, `return_free_qty`, `transaction_date`, `transaction_time`, `return_total_amount`, `return_discount`, `tcs_perc`, `tcs_applicable`, `tcs_Amt`, `return_net_amt`, `return_cess_amt`, `return_cgst_amt`, `return_sgst_amt`, `return_igst_amt`, `debit_note`, `adjust_amount`, `debit_note_status`, `update_datetime`, `debit_note_receipt`, `party_id`, `bill_no`, `bill_date`, `bill_time`, `unique_bill`, `purchase_type`, `message_txn_id`, `insert_datetime`) VALUES ('".$fetch_val['transaction_id']."','$proid','".$fetch_val['product_price']."','$session_dist_ver','".$fetch_val['old_quantity']."','".$fetch_val['old_total_Amount']."','".$fetch_val['old_cgst']."','".$fetch_val['old_sgst']."','".$fetch_val['return_quantity']."','".$fetch_val['return_free_qty']."','".$fetch_val['transaction_date']."','".$fetch_val['transaction_time']."','".$fetch_val['return_total_amount']."','".$fetch_val['return_discount']."','".$fetch_val['tcs_perc']."','".$fetch_val['tcs_applicable']."','".$fetch_val['tcs_Amt']."','".$fetch_val['return_net_amt']."','".$fetch_val['return_cess_amt']."','".$fetch_val['return_cgst_amt']."','".$fetch_val['return_sgst_amt']."','".$fetch_val['return_igst_amt']."','".$fetch_val['debit_note']."','0','".$fetch_val['debit_note_status']."','".$fetch_val['update_datetime']."','".$fetch_val['debit_note_receipt']."','".$fetch_val['party_id']."','".$fetch_val['bill_no']."','".$fetch_val['bill_date']."','".$fetch_val['bill_time']."','".$fetch_val['unique_bill']."','".$fetch_val['purchase_type']."','".$fetch_val['message_txn_id']."','".$fetch_val['insert_datetime']."')");
		
		$uq_stock=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock+'$temp_quantity',2),time='$scri' where date ='$cdate' and distributor_id='$session_dist_ver' and product_id='$proid'");
		$uq_product=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=round(stock_quantity+'$temp_quantity',2),tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$session_dist_ver'");
		
		$res_detail = mysqli_query($con,"SELECT * FROM `tbl_purchase_return_serialno` where product_id='$proid' and unique_bill='$uid'");
		if(mysqli_num_rows($res_detail))
		{
			while($fetch_detail=mysqli_fetch_assoc($res_detail))
			{
				$t_selectimei=$fetch_detail['IMEI'];
				$insertQry=mysqli_query($con,"INSERT IGNORE INTO `tbl_product_serialno`(`product_id`, `IMEI`, `insert_date`, `insert_time`,`status`,`unique_bill`) VALUES ('$proid','$t_selectimei','$cdate','$scri','Available','$uid')");
				if($insertQry)
				{
					$query_delete_detail = mysqli_query($con,"delete from `tbl_purchase_return_serialno` where product_id='$proid' and unique_bill='$uid' and stock_id='".$fetch_detail['stock_id']."'");
				}
				
			}
		}
	}		
	if($query_insert)
	{
		$res_txn_delete = mysqli_query($con,"delete from `tbl_purchase_return_transaction` where distributor_id='$session_dist_ver' and bill_no='$bid' and party_id='$p_id' and unique_bill='$uid' and debit_note_receipt='$rec_id' and insert_datetime like '%$cdate%'");
		
		include("sale-purchase-balance-effect-class.php");
		$CashCollection=new Collectionbalance();
		$collections=$CashCollection->purchasecollection($session_dist_ver,$get_total_amt,$cdate,$p_id);
		
		if($res_txn_delete)
		{
			$response['success']='1';
			$response['details']="Bill Successfully Cancelled";
		}
		else
		{
			$response['success']='1';
			$response['details']="Bill can't be Cancelled. please check and try again later!!";
		}
	}
	else
	{
		$response['success']='1';
		$response['details']="Something Went wrong. please contact to administrator!!";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);


?>