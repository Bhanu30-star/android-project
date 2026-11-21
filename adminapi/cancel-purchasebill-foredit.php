<?php
ob_start();
// $con->close();
class Collection_cancel 
{
	function admincollection($session_dist_ver,$uid,$id1)
	{
		ob_start();
		include("../../connect.php");
		
		$scro = date("h:i:s");
		$da  = date("Y-m-d");
		$scri =$da." ".$scro;
		
		$restrict_admin=0;
		$check_author_detail = mysqli_query($con,"SELECT dsr_requirement,serialno_configuration FROM `tbl_distributor` WHERE distributor_id='$session_dist_ver'");
		while($row_data = mysqli_fetch_array($check_author_detail)){
			$actual_dsr_requirement=$row_data['dsr_requirement'];
			$serialno_configuration=$row_data['serialno_configuration'];
		}
		if($restrict_admin==0)
		{
			$actual_pur_net_amt=0;
			$pay_mode='';
			$res_charges = mysqli_query($con,"SELECT * FROM `tbl_distributor_transaction_charges` WHERE distributor_id='$session_dist_ver' AND party_id='$id1' AND unique_bill='$uid'");
			while($fetch_charges=mysqli_fetch_assoc($res_charges)){
				$actual_pur_net_amt=$fetch_charges['net_amt'];
				$st_query1 = mysqli_query($con,"INSERT INTO `tbl_distributor_transaction_charges_history`(`distributor_id`, `party_id`, `bill_no`, `unique_bill`, `bill_date`, `labour_charges`, `freight_charges`, `other_expenses`, `total_amt`, `is_tcs`, `tcs_percentage`, `tcs_amt`, `disc_amt`, `net_amt`)VALUES('".$fetch_charges['distributor_id']."','".$fetch_charges['party_id']."','".$fetch_charges['bill_no']."','".$fetch_charges['unique_bill']."','".$fetch_charges['bill_date']."','".$fetch_charges['labour_charges']."','".$fetch_charges['freight_charges']."','".$fetch_charges['other_expenses']."','".$fetch_charges['total_amt']."','".$fetch_charges['is_tcs']."','".$fetch_charges['tcs_percentage']."','".$fetch_charges['tcs_amt']."','".$fetch_charges['disc_amt']."','".$fetch_charges['net_amt']."')");
			}
			$res_detail = mysqli_query($con,"SELECT * FROM `tbl_distributor_transaction` WHERE distributor_id='$session_dist_ver' AND party_id='$id1' AND unique_bill='$uid' AND txn_type='Add'");
			while($fetch_proDetail=mysqli_fetch_assoc($res_detail))
			{
				$pro_id=$fetch_proDetail['product_id'];
				$pay_mode=$fetch_proDetail['payment_mode'];
				$cheq_bank_id=$fetch_proDetail['bank_id'];
				$pro_quantity=$fetch_proDetail['quantity'];
				$transaction_date=$fetch_proDetail['transaction_date'];
				$txn_bill_date=$fetch_proDetail['bill_date'];
				$billno1=$fetch_proDetail['message_txn_id'];
				
				$st_query1 = mysqli_query($con,"INSERT INTO `tbl_purchase_bill_cancel`(`transaction_id`,`product_id`,`distributor_id`,`user_id`,`quantity`,`transaction_date`, `transaction_time`, `txn_type`, `total_amount`, `cgst_amt`, `sgst_amt`, `party_id`, `bill_no`, `unique_bill`, `bill_date`, `bill_time`, `insert_datetime`, `action_by`,`conversion`,`remark_detail`,`igst_amt`, `product_price`,`purchase_type`,`message_txn_id`, `bag_type`, `bag_qty`, `free_qty`, `bill_type`, `operator_detail`, `bank_id`, `disc_type`, `disc_val`, `cess_amt`, `discount_amt`, `final_net_amt`, `gst_perc`,`action_type`)VALUES('".$fetch_proDetail['transaction_id']."','".$fetch_proDetail['product_id']."','".$fetch_proDetail['distributor_id']."','".$fetch_proDetail['user_id']."','".$fetch_proDetail['quantity']."','".$fetch_proDetail['transaction_date']."','".$fetch_proDetail['transaction_time']."','".$fetch_proDetail['txn_type']."','".$fetch_proDetail['total_amount']."','".$fetch_proDetail['cgst_amt']."','".$fetch_proDetail['sgst_amt']."','".$fetch_proDetail['party_id']."','".$fetch_proDetail['bill_no']."','".$fetch_proDetail['unique_bill']."','".$fetch_proDetail['bill_date']."','".$fetch_proDetail['bill_time']."','$scri','$dis_user_id','".$fetch_proDetail['conversion']."','".$fetch_proDetail['remark_detail']."','".$fetch_proDetail['igst_amt']."','".$fetch_proDetail['product_price']."','".$fetch_proDetail['purchase_type']."','".$fetch_proDetail['message_txn_id']."','".$fetch_proDetail['bag_type']."','".$fetch_proDetail['bag_qty']."','".$fetch_proDetail['free_qty']."','".$fetch_proDetail['bill_type']."','".$fetch_proDetail['operator_detail']."','$cheq_bank_id','".$fetch_proDetail['disc_type']."','".$fetch_proDetail['disc_val']."','".$fetch_proDetail['cess_amt']."','".$fetch_proDetail['discount_amt']."','".$fetch_proDetail['final_net_amt']."','".$fetch_proDetail['gst_perc']."','Edit')");
				
				if($serialno_configuration=="Standard"){
					$res_detail_serialno = mysqli_query($con,"SELECT * FROM `tbl_product_serialno` WHERE product_id='$pro_id' AND unique_bill='$uid'");
					while($fetch_proDetail_serialno=mysqli_fetch_assoc($res_detail_serialno)){
						$st_query2 = mysqli_query($con,"INSERT IGNORE INTO `tbl_purchase_cancel_serialno` (`stock_id`, `product_id`, `IMEI`, `status`, `unique_bill`, `insert_date`, `insert_time`, `update_datetime`, `user_id`, `assign_date`, `assign_time`, `saleout_date`, `saleout_time`, `cancel_datetime`)VALUES('".$fetch_proDetail_serialno['stock_id']."','".$fetch_proDetail_serialno['product_id']."','".$fetch_proDetail_serialno['IMEI']."','".$fetch_proDetail_serialno['status']."','".$fetch_proDetail_serialno['unique_bill']."','".$fetch_proDetail_serialno['insert_date']."','".$fetch_proDetail_serialno['insert_time']."','".$fetch_proDetail_serialno['update_datetime']."','".$fetch_proDetail_serialno['user_id']."','".$fetch_proDetail_serialno['assign_date']."','".$fetch_proDetail_serialno['assign_time']."','".$fetch_proDetail_serialno['saleout_date']."','".$fetch_proDetail_serialno['saleout_time']."','$scri')");
					}
				}
				
				$delete_message=mysqli_query($con,"DELETE FROM `tbl_distributor_purchase_msg` WHERE distributor_id='$session_dist_ver' AND transaction_id='$billno1'");
				$uq2=mysqli_query($con,"UPDATE `tbl_product` SET stock_quantity=round(stock_quantity-'$pro_quantity',2) WHERE distributor_id='$session_dist_ver' AND product_id='$pro_id'");
				
				$uq1=mysqli_query($con,"UPDATE `tbl_distributor_stock` SET closing_stock=round(closing_stock-'$pro_quantity',2) WHERE distributor_id='$session_dist_ver' AND product_id='$pro_id' AND date='$transaction_date'");
				
				$uq3=mysqli_query($con,"UPDATE `tbl_distributor_stock` SET opening_stock=round(opening_stock-'$pro_quantity',2),closing_stock = round(closing_stock-'$pro_quantity',2) WHERE distributor_id='$session_dist_ver' AND product_id='$pro_id' AND date>'$transaction_date'");
				
			}
				
			$res_purchase_adjust = mysqli_query($con,"SELECT * FROM tbl_debit_note_adjustment where distributor_id='$session_dist_ver' AND unique_bill='$uid'");
			if(mysqli_num_rows($res_purchase_adjust)>0){
				while($fetch_pending_data=mysqli_fetch_assoc($res_purchase_adjust)){
					$adjust_debit_amt=$fetch_pending_data['adjust_amount'];
					$st_query11 = mysqli_query($con,"INSERT IGNORE INTO `tbl_debitnote_adjustment_cancel`(`distributor_id`, `adjust_amount`, `bill_no`, `unique_bill`, `adjust_type`, `adjust_txn_id`, `insert_date`, `insert_time`,`cancel_date`,`cancel_time`)VALUES('$session_dist_ver','".$fetch_pending_data['adjust_amount']."','".$fetch_pending_data['bill_no']."','".$fetch_pending_data['unique_bill']."','".$fetch_pending_data['adjust_type']."','".$fetch_pending_data['adjust_txn_id']."','".$fetch_pending_data['insert_date']."','".$fetch_pending_data['insert_time']."','$da','$scro')");
					$adjust_txn_id=$fetch_pending_data['adjust_txn_id'];
					if($fetch_pending_data['adjust_type']=="Debit Note"){
						$uq1=mysqli_query($con,"UPDATE `tbl_party_debit_note` SET adjust_amount=round(adjust_amount-'$adjust_debit_amt',2),debit_note_status='Pending' WHERE purchase_party_id='$id1' AND distributor_id='$session_dist_ver' AND debitnote_id='$adjust_txn_id'");
					}else{
						$uq1=mysqli_query($con,"UPDATE tbl_purchase_return_transaction SET adjust_amount=round(adjust_amount-'$adjust_debit_amt',2),debit_note_status='Pending' WHERE party_id='$id1' AND distributor_id='$session_dist_ver' AND history_id='$adjust_txn_id'");
					}
				}
				$res_debitnote = mysqli_query($con,"DELETE FROM `tbl_debit_note_adjustment` WHERE distributor_id='$session_dist_ver' AND unique_bill='$uid'");
			}
				
			if($st_query1)
			{
				$resd1 = mysqli_query($con,"DELETE FROM `tbl_distributor_transaction` WHERE distributor_id='$session_dist_ver' AND party_id='$id1' AND unique_bill='$uid' AND txn_type='Add'");
				$resd2= mysqli_query($con,"DELETE FROM `tbl_product_serialno` WHERE unique_bill='$uid'");
				$resd3=mysqli_query($con,"DELETE FROM `tbl_distributor_transaction_charges` WHERE distributor_id='$session_dist_ver' AND party_id='$id1' AND unique_bill='$uid'");
				if($pay_mode=='Credit'){
					include_once("sale-purchase-balance-effect-class.php");
					$balanceCollection=new Collectionbalance();
					$collectionsdata=$balanceCollection->purchaseminuscollection($session_dist_ver,$actual_pur_net_amt,$txn_bill_date,$id1);
				}
				
				if($actual_dsr_requirement=="Yes")
				{
						include_once("cash_bank_effect_class.php");
						if($pay_mode=='Cash'){
							$CashCollection=new Collection();
							$collections=$CashCollection->cashcollection($session_dist_ver,$actual_pur_net_amt,$transaction_date);
						}else if($pay_mode=='Online'){
							$CashCollection=new Collection();
							$collections=$CashCollection->bankcollection($session_dist_ver,$cheq_bank_id,$actual_pur_net_amt,$transaction_date);
						}
				}			
			}
			if($resd1)
			{
				return 1;
			}
			else
			{
				return 2;
			}
		}
		else
		{
			return 3;
		}
	}
}
?>