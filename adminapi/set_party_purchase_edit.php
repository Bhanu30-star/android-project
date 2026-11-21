<?php
include("../../connect.php");
$response = array();
if(isset($_POST['party_id']) && isset($_POST['distributor_id']) && isset($_POST['total_order']) && isset($_POST['unique_bill']))
{
	$changes_flag=1;
	$uniquebill = $_POST['unique_bill'];
	$ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("h:i:sa");				
	$cdate  = date("Y-m-d");				     
	$scri =$cdate.' '.$scro;
	$pid = $_POST['party_id'];
	$actual_dsr_requirement=$_POST['dsr_requirement'];
	
	$total_final_amt = isset($_POST['total_final_amt']) ? $_POST['total_final_amt'] : '0';
	$net_final_amt = isset($_POST['net_final_amt']) ? $_POST['net_final_amt'] : '0';
	$bill_disc_amt=$_POST['discount_on_total'];
	$tcs_Amt = isset($_POST['tcs_Amt']) ? $_POST['tcs_Amt'] : '0';
	$pmode='';
	
	
	$toder = $_POST['total_order'];
	$json_a=json_decode($toder, true);     
	foreach ($json_a as $person_a)
	{
		$temp_pro_trans_id=$person_a['trans_id'];
		$txn_productId=$person_a['product_id'];
		$pquanity=$person_a['quantity'];
		$res_checking = mysqli_query($con,"select * from tbl_distributor_transaction where distributor_id='$ver' and party_id='$pid' and unique_bill='$uniquebill' and txn_type='Add' and transaction_id='$temp_pro_trans_id'");
		while($fetch_checking=mysqli_fetch_assoc($res_checking))
		{   
			$trans_actual_qty=$fetch_checking['quantity'];
			$transaction_date=$fetch_checking['transaction_date'];
			$bill_date_val=$fetch_checking['bill_date'];
			$cheq_bank_id=$fetch_checking['bank_id'];
			$pmode=$fetch_checking['payment_mode'];
			if($trans_actual_qty>$pquanity)
			{
				$final_qty=$trans_actual_qty-$pquanity;
				$resstock_detail = mysqli_query($con,"select tbl_distributor_stock.closing_stock from tbl_distributor_stock where distributor_id='$ver' and product_id='$txn_productId' and date>='$transaction_date'");
				while($fetch_stockDetail=mysqli_fetch_assoc($resstock_detail))
				{
					if($fetch_stockDetail['closing_stock']<$final_qty)
							$changes_flag=0;
				}
			}
		}
	}
	$temp_id=1;
	$res_checking = mysqli_query($con,"select * from tbl_distributor_transaction where distributor_id='$ver' and party_id='$pid' and unique_bill='$uniquebill' and txn_type='Add'");
	while($fetch_checking=mysqli_fetch_assoc($res_checking))
	{   
		$trans_actual_freeqty=$fetch_checking['free_qty'];
		$txn_productId=$fetch_checking['product_id'];
		$transaction_date=$fetch_checking['transaction_date'];
		$fetch_pro1="profreeqty".$temp_id;
		$pquanity=$_POST[$fetch_pro1];
		if($pquanity!="")
		{ 
			if($trans_actual_freeqty>$pquanity)
			{
				$final_qty=$trans_actual_freeqty-$pquanity;
				$resstock_detail = mysqli_query($con,"select closing_stock from tbl_distributor_free_stock where distributor_id='$ver' and product_id='$txn_productId' and date>='$transaction_date'");
				while($fetch_stockDetail=mysqli_fetch_assoc($resstock_detail))
				{
					if($fetch_stockDetail['closing_stock']<$final_qty)
						$changes_flag=0;
				}
			}
		}
		$temp_id++;
	}
	if($changes_flag==1)
	{
		$json_a1=json_decode($toder, true);     
		foreach ($json_a1 as $person_a)
		{
			$temp_pro_trans_id=$person_a['trans_id'];
			$temp_pro_id=$person_a['product_id'];
			$pquanity=$person_a['quantity'];
			$pcgst=isset($person_a['cgst_amt']) ? $person_a['cgst_amt'] : '0';
			$psgst=isset($person_a['sgst_amt']) ? $person_a['sgst_amt'] : '0';
			$pigst=isset($person_a['igst_amt']) ? $person_a['igst_amt'] : '0';
			$temp_total_amt=$person_a['total_amt'];
			$pdiscount=$person_a['disc_amount'];
			$pnetamt=$person_a['net_amount'];
			$pcess=isset($person_a['cess_amount']) ? $person_a['cess_amount'] : '0';
			$p_bag=isset($person_a['probag']) ? $person_a['probag'] : '0';
			$p_bag_qty=isset($person_a['probagqty']) ? $person_a['probagqty'] : '0';
			$pfree_quanity=isset($person_a['free_qty']) ? $person_a['free_qty'] : '0';
			$res11 = mysqli_query($con,"select * from tbl_distributor_transaction where distributor_id='$ver' and party_id='$pid' and unique_bill='$uniquebill' and txn_type='Add' and transaction_id='$temp_pro_trans_id'");
			while($fetch_product11=mysqli_fetch_assoc($res11))
			{  
				$trans_actual_qty=$fetch_product11['quantity'];
				$transaction_date=$fetch_product11['transaction_date'];
				$trans_actual_freeqty=$fetch_product11['free_qty'];
				$query = mysqli_query($con,"INSERT IGNORE INTO `tbl_distributor_transaction_updation`(`transaction_id`, `product_id`, `product_price`, `distributor_id`, `quantity`, `transaction_date`, `transaction_time`, `conversion`, `txn_type`, `total_amount`, `cess_amt`, `discount_amt`, `final_net_amt`, `cgst_amt`, `sgst_amt`, `igst_amt`, `party_id`, `bill_no`, `unique_bill`, `bill_date`, `bill_time`, `purchase_type`, `message_txn_id`, `purchase_category`, `remark_detail`, `payment_mode`, `payment_type`, `payment_status`, `pay_amount`, `pay_remark`, `bank_wallet_name`, `payment_txn_id`, `cheque_txn_date`, `update_bill_datetime`,`bag_type`, `bag_qty`,`free_qty`) VALUES ('$temp_pro_trans_id','$temp_pro_id','".$fetch_product11['product_price']."','$ver','".$fetch_product11['quantity']."','".$fetch_product11['transaction_date']."','".$fetch_product11['transaction_time']."','".$fetch_product11['conversion']."','".$fetch_product11['txn_type']."','".$fetch_product11['total_amount']."','".$fetch_product11['cess_amt']."','".$fetch_product11['discount_amt']."','".$fetch_product11['final_net_amt']."','".$fetch_product11['cgst_amt']."','".$fetch_product11['sgst_amt']."','".$fetch_product11['igst_amt']."','".$fetch_product11['party_id']."','".$fetch_product11['bill_no']."','".$fetch_product11['unique_bill']."','".$fetch_product11['bill_date']."','".$fetch_product11['bill_time']."','".$fetch_product11['purchase_type']."','".$fetch_product11['message_txn_id']."','".$fetch_product11['purchase_category']."','".$fetch_product11['remark_detail']."','".$fetch_product11['payment_mode']."','".$fetch_product11['payment_type']."','".$fetch_product11['payment_status']."','".$fetch_product11['pay_amount']."','".$fetch_product11['pay_remark']."','".$fetch_product11['bank_wallet_name']."','".$fetch_product11['payment_txn_id']."','".$fetch_product11['cheque_txn_date']."','$scri','".$fetch_product11['bag_type']."','".$fetch_product11['bag_qty']."','$')");
			
				$update_purchase_trans = mysqli_query($con,"UPDATE `tbl_distributor_transaction` SET `quantity`='$pquanity',`total_amount`='$temp_total_amt',cgst_amt='$pcgst',sgst_amt='$psgst',igst_amt='$pigst',final_net_amt='$pnetamt',cess_amt='$pcess',discount_amt='$pdiscount',bag_type='$p_bag',bag_qty='$p_bag_qty',free_qty='$pfree_quanity' WHERE product_id='$temp_pro_id' and distributor_id='$ver' and transaction_id='$temp_pro_trans_id' and txn_type='Add'");
				if($update_purchase_trans)
				{
					if($trans_actual_qty>$pquanity)
					{
						$pro_quantity=$trans_actual_qty-$pquanity;
						$uq2=mysqli_query($con,"UPDATE tbl_product SET stock_quantity = round(stock_quantity-'$pro_quantity',2) where distributor_id='$ver' and product_id='$temp_pro_id'");
						$uq1=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock = round(closing_stock-'$pro_quantity',2) where distributor_id='$ver' and product_id='$temp_pro_id' and date='$transaction_date'");
						$uq3=mysqli_query($con,"UPDATE tbl_distributor_stock SET opening_stock= round(opening_stock-'$pro_quantity',2),closing_stock = round(closing_stock-'$pro_quantity',2) where distributor_id='$ver' and product_id='$temp_pro_id' and date>'$transaction_date'");
					}
					else
					{
						$pro_quantity=$pquanity-$trans_actual_qty;
						$uq2=mysqli_query($con,"UPDATE tbl_product SET stock_quantity = round(stock_quantity+'$pro_quantity',2) where distributor_id='$ver' and product_id='$temp_pro_id'");
						$uq1=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock = round(closing_stock+'$pro_quantity',2) where distributor_id='$ver' and product_id='$temp_pro_id' and date='$transaction_date'");
						$uq3=mysqli_query($con,"UPDATE tbl_distributor_stock SET opening_stock= round(opening_stock+'$pro_quantity',2),closing_stock = round(closing_stock+'$pro_quantity',2) where distributor_id='$ver' and product_id='$temp_pro_id' and date>'$transaction_date'");
					}
				}
			}
		}
		
		$client_charges_detail= mysqli_query($con,"SELECT * FROM `tbl_distributor_transaction_charges` WHERE distributor_id='$ver' and unique_bill='$uniquebill' and party_id='$pid'");
		while($pro_fetch_charges=mysqli_fetch_array($client_charges_detail)) 
		{ 
			$actual_pur_bal_amt=$net_final_amt-$pro_fetch_charges['net_amt'];
			$uq_update=mysqli_query($con,"UPDATE tbl_distributor_transaction_charges SET total_amt='$total_final_amt',tcs_amt='$tcs_Amt',net_amt='$net_final_amt',disc_amt='$bill_disc_amt' where party_id='$pid' and unique_bill='$uniquebill' and distributor_id='$ver'");
			
			if($pmode=='Credit')
			{
				include("sale-purchase-balance-effect-class.php");
				$CashCollection=new Collectionbalance();
				$collections=$CashCollection->purchasecollection($ver,$actual_pur_bal_amt,$bill_date_val,$pid);
			}
			
			if($actual_dsr_requirement=="Yes")
			{
				include("cash_bank_effect_class.php");
				if($pro_fetch_charges['net_amt']>$net_final_amt)
				{
					$actual_pur_net_amt=$pro_fetch_charges['net_amt']-$net_final_amt;
					if($pmode=='Cash')
					{
						$CashCollection=new Collection();
						$collections=$CashCollection->cashcollection($ver,$actual_pur_net_amt,$transaction_date);
					}
					else if($pmode=='Online')
					{
						$CashCollection=new Collection();
						$collections=$CashCollection->bankcollection($ver,$cheq_bank_id,$actual_pur_net_amt,$transaction_date);
					}
				}
				else
				{
					$actual_pur_net_amt=$net_final_amt-$pro_fetch_charges['net_amt'];
					if($pmode=='Cash')
					{
						$CashCollection=new Collection();
						$collections=$CashCollection->purchasecashcollection($ver,$actual_pur_net_amt,$transaction_date);
					}
					else if($pmode=='Online')
					{
						$CashCollection=new Collection();
						$collections=$CashCollection->purchasebankcollection($ver,$cheq_bank_id,$actual_pur_net_amt,$transaction_date);
					}
				}
			}
		}
		$response['success']='1';
		$response['details']="Purchase Return Successfully";
	}
	else
	{
		$response['success']='0';
		$response['details']="Action not allowed,your stock goes in negative direction..!";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>