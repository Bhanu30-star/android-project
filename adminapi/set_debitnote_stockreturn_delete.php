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
	$get_total_amt=0;
	$res11 = mysqli_query($con,"SELECT * FROM `tbl_party_debit_note` where distributor_id='$session_dist_ver' and bill_no='$bid' and purchase_party_id='$p_id' and unique_bill='$uid'");
	while($fetch_val=mysqli_fetch_assoc($res11))
	{
		$proid=$fetch_val['product_id'];
		$temp_quantity=$fetch_val['quantity'];
		$get_total_amt=$get_total_amt+$fetch_val['final_net_amt'];
		$billdate=$fetch_val['bill_date'];
		$query_insert = mysqli_query($con,"INSERT INTO `tbl_party_debit_note_history`(`distributor_id`, `purchase_party_id`, `bill_no`, `product_id`, `quantity`, `product_price`, `total_amount`, `cgst_amt`, `sgst_amt`, `igst_amt`, `is_tcs`, `tcs_percentage`, `tcs_amount`, `final_net_amt`, `cess_amt`, `bill_date`, `bill_time`, `transaction_date`, `transaction_time`, `unique_bill`, `bill_type`, `remark`, `debit_note_type`, `adjust_amount`, `debit_note_status`, `debitnote_billtype`) VALUES ('$session_dist_ver','".$fetch_val['purchase_party_id']."','".$fetch_val['bill_no']."','".$fetch_val['product_id']."','".$fetch_val['quantity']."','".$fetch_val['product_price']."','".$fetch_val['total_amount']."','".$fetch_val['cgst_amt']."','".$fetch_val['sgst_amt']."','".$fetch_val['igst_amt']."','".$fetch_val['is_tcs']."','".$fetch_val['tcs_percentage']."','".$fetch_val['tcs_amount']."','".$fetch_val['final_net_amt']."','".$fetch_val['cess_amt']."','".$fetch_val['bill_date']."','".$fetch_val['bill_time']."','".$fetch_val['transaction_date']."','".$fetch_val['transaction_time']."','".$fetch_val['unique_bill']."','".$fetch_val['bill_type']."','".$fetch_val['remark']."','".$fetch_val['debit_note_type']."','0','".$fetch_val['debit_note_status']."','".$fetch_val['debitnote_billtype']."')");
		
		$uq_stock=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock+'$temp_quantity',2),time='$scri' where date ='$cdate' and distributor_id='$session_dist_ver' and product_id='$proid'");
		$uq_product=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=round(stock_quantity+'$temp_quantity',2),tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$session_dist_ver'");
		
		$res_detail = mysqli_query($con,"SELECT * FROM `tbl_party_debit_note_deatil` where product_id='$proid' and unique_bill='$uid'");
		if(mysqli_num_rows($res_detail))
		{
			while($fetch_detail=mysqli_fetch_assoc($res_detail))
			{
				$t_selectimei=$fetch_detail['imei_no'];
				$query_insert_detail = mysqli_query($con,"INSERT INTO `tbl_party_debit_note_deatil_history`(`product_id`, `IMEI`, `unique_bill`, `insert_date`, `insert_time`) VALUES ('$proid','$t_selectimei','".$fetch_detail['unique_bill']."','".$fetch_detail['insert_date']."','".$fetch_detail['insert_time']."')");
				$insertQry=mysqli_query($con,"INSERT IGNORE INTO `tbl_product_serialno`(`product_id`, `IMEI`, `insert_date`, `insert_time`,`status`,`unique_bill`) VALUES ('$proid','$t_selectimei','$cdate','$scri','Available','".$fetch_detail['imei_unique_bill']."')");
			}
		}
	}		
	if($query_insert)
	{
		$res_txn_delete = mysqli_query($con,"delete from `tbl_party_debit_note` where distributor_id='$session_dist_ver' and bill_no='$bid' and purchase_party_id='$p_id' and unique_bill='$uid'");
		
		include("sale-purchase-balance-effect-class.php");
		$CashCollection=new Collectionbalance();
		$collections=$CashCollection->purchasecollection($session_dist_ver,$get_total_amt,$billdate,$p_id);
		
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