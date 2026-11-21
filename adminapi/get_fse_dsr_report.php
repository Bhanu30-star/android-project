<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['username']) && isset($_POST['searchdate1']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$cdate=$_POST['searchdate1'];
	$cparty=$_POST['username'];
	$res_user = mysqli_query($con,"select * from tbl_user where (user_phone='$cparty' or user_name='$cparty') and user_type='2' and distributor_id='$session_dist_ver' and status in ('Active')");
	while($fetch_user=mysqli_fetch_assoc($res_user))
	{
		$temp_user_id=$fetch_user['user_id'];
		$temp_user_name=$fetch_user['user_name'];
		$temp_user_phone=$fetch_user['user_phone'];
		$work_type=$fetch_user['work_type'];
		$flag=1;
	}
	
	$res_dsr = mysqli_query($con,"select * from tbl_dsr where user_id='$temp_user_id' and date='$cdate' and dsr_status in ('Pending', 'Accept') and type!='System Generated Entry'");
	if(mysqli_num_rows($res_dsr)<=0)
	{
		$flag=0;
		$response['success']='0';
		$response['details']="DSR Not Submitted Yet!";
	}
	else
	{
		while($row_dsr=mysqli_fetch_assoc($res_dsr))
		{
			$temp_dsr_final_id=$row_dsr['dsr_id'];
			$dsr_status_final=$row_dsr['dsr_status'];
			$dsr_submit_time=$row_dsr['time'];
			$dsr_submit_time=date('h:i:sa', strtotime($dsr_submit_time));
		}
	}
	$last_previous_dsr=0;
	$res_dsr_last = mysqli_query($con,"select * from tbl_dsr where user_id='$temp_user_id' and dsr_status in ('Pending','Accept') and date<'$cdate' and type!='System Generated Entry' order by dsr_id desc limit 1");
	while($row_dsr_last=mysqli_fetch_assoc($res_dsr_last))
	{
		$last_previous_dsr=$row_dsr_last['date'];
		$r_date=strtotime($last_previous_dsr);
		$r2_date= strtotime("+1 day", $r_date);
		$d2_date=trim(date('Y-m-d', $r2_date));
	}
	if($last_previous_dsr==0)
	{
		$res_dsr_last=mysqli_query($con,"SELECT * FROM tbl_party_transaction where transaction_from='$temp_user_id' and txn_id='' and payment_status!='Converted' and source not in ('Web','Admin') order by transaction_id  ASC limit 1");
		while($row_dsr_last=mysqli_fetch_assoc($res_dsr_last))
		{
			$d2_date=$row_dsr_last['transaction_date'];
			$r_date=strtotime($d2_date);
			$r2_date= strtotime("-1 day", $r_date);
			$last_previous_dsr=trim(date('Y-m-d', $r2_date));
		}
	}
	
	if($flag==1)
	{
		$response['from_date']=$d2_date;
		$response['to_date']=$cdate;
		$temp_tamt=$actualGrandamt=$tempCollectionAmt=$ftempCollectionAmt=$actualamt=$temp_camt=$temp_rcamt=$temp_rchamt=$temp_chamt=$temp_credit=$temp_amt=$temp_online=$temp_ronamt=0;
		$fse_dsr=array();
		
		$res=mysqli_query($con,"SELECT * FROM tbl_party_transaction,tbl_party where tbl_party_transaction.transaction_to = tbl_party.party_id and tbl_party_transaction.transaction_from='$temp_user_id' and tbl_party_transaction.transaction_date>'$last_previous_dsr' and tbl_party_transaction.transaction_date<='$cdate' and txn_id='' and tbl_party_transaction.converted_transaction_id='' and tbl_party_transaction.source not in ('Web','Admin')");
		if(mysqli_num_rows($res)>0)
		{     
			while($fetch_product2=mysqli_fetch_assoc($res))
			{
				extract($fetch_product2);
				$temp_transaction=$transaction_id;
				if($payment_mode=="Credit")
				{
					$temp_credit=$temp_credit+$final_amt;
				}
				else if($payment_mode=="Cheque")
				{
					$temp_chamt=$temp_chamt+$final_amt;
					$temp_amt=$temp_amt+$final_amt;
				}
				else if($payment_mode=="Cash")
				{
					$temp_camt=$temp_camt+$final_amt;
					$temp_amt=$temp_amt+$final_amt;
				}
				else if($payment_mode=="Both")
				{
					$temp_camt=$temp_camt+$cash_amount;
					$temp_amt=$temp_amt+$final_amt;
					$temp_chamt=$temp_chamt+$cheque_amount;
				}
				else
				{
					$temp_amt=$temp_amt+$final_amt;
					$temp_online=$temp_online+$cheque_amount;
				}
				$res_detail=mysqli_query($con,"SELECT *,tbl_party_transaction_detail.product_price as saleprice FROM tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id=tbl_product.product_id and tbl_party_transaction_detail.transaction_id='$temp_transaction'");
				while($fetch_detail=mysqli_fetch_assoc($res_detail))
				{
					$actualGrandamt=$actualGrandamt+round(($fetch_detail['saleprice']*$fetch_detail['quantity']),2);
					
					$fse_dsr['party_detail']=$party_name.' - '.$party_phone;
					$fse_dsr['transaction_bill_number']=$transaction_bill_number;
					$fse_dsr['product_name']=$fetch_detail['product_name'];
			
					$fse_dsr['quantity']=$fetch_detail['quantity'];
					$fse_dsr['amount']=round($fetch_detail['saleprice']*$fetch_detail['quantity'],3);
					if($payment_mode!="Credit")  
						$fse_dsr['cash_amt']=$cash_amount;
					else
						$fse_dsr['cash_amt']=0;
					if($payment_mode=="Cheque" || $payment_mode=="Both")
						$fse_dsr['cheque_amt']=$cheque_amount;
					else
						$fse_dsr['cheque_amt']=0;
					$fse_dsr['cheque_no']=$cheque_no;
					$fse_dsr['product_disc']=round($fetch_detail['product_disc'],2);
					if($payment_mode=="Credit")
						$fse_dsr['credit_amt']=$final_amt;
					else
						$fse_dsr['credit_amt']=0;
					if($payment_mode=="Online" || $payment_mode=="Wallet")
						$fse_dsr['online_amt']=$final_amt;
					else
						$fse_dsr['online_amt']=0;
					if($fetch_product2['bank_id']>0) 
					{ 
						$bank_matser_detail=mysqli_query($con,"SELECT * FROM tbl_distributor_bank_master WHERE distributor_id='$session_dist_ver' and bank_master_id='".$fetch_product2['bank_id']."'");
						if(mysqli_num_rows($bank_matser_detail)>0)
						{     
							$fetch_product=mysqli_fetch_array($bank_matser_detail);
							$fse_dsr['bank_detail']=$fetch_product['bank_name'];
						} 
					}
					else
					{
						$fse_dsr['bank_detail']='';
					}
					$response['fse_dsr'][]=$fse_dsr;
				}
			}
		}
		$res11=mysqli_query($con,"SELECT tbl_party_transaction.transaction_id,tbl_receipt_transaction.txn_receipt_id, tbl_receipt_transaction.receipt_date, tbl_party_transaction.transaction_to,tbl_receipt_transaction.total_amount,tbl_receipt_transaction.cash_amount,tbl_receipt_transaction.cheque_amount,tbl_receipt_transaction.payment_mode,tbl_receipt_transaction.adjust_amount,tbl_party_transaction.transaction_date,tbl_party.party_name,tbl_party.party_phone,tbl_receipt_transaction.bank_id,tbl_receipt_transaction.receipt_disc_amt,tbl_party_transaction.source FROM tbl_receipt_transaction, tbl_party_transaction, tbl_party where tbl_party_transaction.transaction_to = tbl_party.party_id and tbl_party_transaction.transaction_id = tbl_receipt_transaction.transaction_id and tbl_receipt_transaction.receipt_date>'$last_previous_dsr' and tbl_receipt_transaction.receipt_date<='$cdate' and tbl_receipt_transaction.generated_user_id='$temp_user_id' and tbl_receipt_transaction.source not in ('Web','Admin') and tbl_receipt_transaction.payment_mode not in ('Adjust Advance Payment','Adjust Credit Note')");
		if(mysqli_num_rows($res11)>0)
		{     
			while($fetch_product21=mysqli_fetch_assoc($res11))
			{
				extract($fetch_product21);
				if($fetch_product21['transaction_date']==$cdate && $fetch_product21['source']=='')
					$ftempCollectionAmt=$ftempCollectionAmt+$fetch_product21['total_amount'];
				else
					$tempCollectionAmt=$tempCollectionAmt+$fetch_product21['total_amount'];
				if($fetch_product21['payment_mode']=='Cash')
					$temp_rcamt=$temp_rcamt+$fetch_product21['cash_amount'];
				else if($fetch_product21['payment_mode']=='Cheque')
					$temp_rchamt=$temp_rchamt+$fetch_product21['cheque_amount'];
				else if($fetch_product21['payment_mode']=='Both')
				{
					$temp_rchamt=$temp_rchamt+$fetch_product21['cheque_amount'];
					$temp_rcamt=$temp_rcamt+$fetch_product21['cash_amount'];
				}
				else if($fetch_product21['payment_mode']=='Online' || $fetch_product21['payment_mode']=='Wallet')
					$temp_ronamt=$temp_ronamt+$fetch_product21['cheque_amount'];
		
				$fse_dsr['party_detail']=$party_name.' - '.$party_phone;
				$fse_dsr['transaction_bill_number']=$fetch_product21['txn_receipt_id'];
				$fse_dsr['product_name']='Credit-Cash Receipt';
				$fse_dsr['quantity']='';
				$fse_dsr['amount']=$fetch_product21['total_amount'];
				$fse_dsr['cash_amt']=$fetch_product21['cash_amount'];
				if($fetch_product21['payment_mode']=="Cheque" || $fetch_product21['payment_mode']=="Both")
					$fse_dsr['cheque_amt']=$fetch_product21['cheque_amount'];
				else
					$fse_dsr['cheque_amt']=0;
				$fse_dsr['cheque_no']=$fetch_product21['cheque_no'];
				$fse_dsr['product_disc']=$fetch_product21['receipt_disc_amt'];
				$fse_dsr['credit_amt']='';
				if($fetch_product21['payment_mode']=="Online" || $fetch_product21['payment_mode']=="Wallet")
					$fse_dsr['online_amt']=$fetch_product21['cheque_amount'];
				else
					$fse_dsr['online_amt']=0;
				if($fetch_product21['bank_id']>0)
				{ 
					$bank_matser_detail=mysqli_query($con,"SELECT * FROM tbl_distributor_bank_master WHERE distributor_id='$session_dist_ver' and bank_master_id='".$fetch_product21['bank_id']."'");
					if(mysqli_num_rows($bank_matser_detail)>0)
					{     
						$fetch_product=mysqli_fetch_array($bank_matser_detail);
						$fse_dsr['bank_detail']=$fetch_product['bank_name'];
					} 
				}
				else
				{
					$fse_dsr['bank_detail']='';
				}
				$response['fse_dsr'][]=$fse_dsr;
			}
		}
		
		$res15=mysqli_query($con,"SELECT * FROM tbl_other_receipt_txn,tbl_party where tbl_other_receipt_txn.party_id=tbl_party.party_id and tbl_other_receipt_txn.user_id='$temp_user_id' and tbl_other_receipt_txn.receipt_date>'$last_previous_dsr' and tbl_other_receipt_txn.receipt_date<='$cdate' and tbl_other_receipt_txn.status='Complete' and tbl_other_receipt_txn.source not in ('Web','Admin')");
		if(mysqli_num_rows($res15)>0)
		{     
			while($fetch_product51=mysqli_fetch_assoc($res15))
			{
				extract($fetch_product51);
				$tempCollectionAmt=$tempCollectionAmt+$fetch_product51['total_amount'];
				if($fetch_product51['payment_mode']=='Cash')
					$temp_rcamt=$temp_rcamt+$fetch_product51['cash_amount'];
				else if($fetch_product51['payment_mode']=='Cheque')
					$temp_rchamt=$temp_rchamt+$fetch_product51['cheque_amount'];
				else if($fetch_product51['payment_mode']=='Both')
				{
					$temp_rchamt=$temp_rchamt+$fetch_product51['cheque_amount'];
					$temp_rcamt=$temp_rcamt+$fetch_product51['cash_amount'];
				}
				else if($fetch_product51['payment_mode']=='Online' || $fetch_product51['payment_mode']=='Wallet')
					$temp_ronamt=$temp_ronamt+$fetch_product51['cheque_amount'];
		
				$fse_dsr['party_detail']=$party_name.' - '.$party_phone;
				$fse_dsr['transaction_bill_number']=$user_receipt_id;
				$fse_dsr['product_name']=$receipt_type;
				$fse_dsr['quantity']='';
				$fse_dsr['amount']=$total_amount;
				$fse_dsr['cash_amt']=$cash_amount;
				if($fetch_product51['payment_mode']=="Cheque" || $fetch_product51['payment_mode']=="Both")
					$fse_dsr['cheque_amt']=$fetch_product51['cheque_amount'];
				else
					$fse_dsr['cheque_amt']=0;
				$fse_dsr['cheque_no']=$cheque_no;
				$fse_dsr['product_disc']='';
				$fse_dsr['credit_amt']='';
				if($fetch_product51['payment_mode']=="Online" || $fetch_product51['payment_mode']=="Wallet")
					$fse_dsr['online_amt']=$fetch_product51['cheque_amount'];
				else
					$fse_dsr['online_amt']=0;
				if($fetch_product51['bank_id']>0)
				{ 
					$bank_matser_detail=mysqli_query($con,"SELECT * FROM tbl_distributor_bank_master WHERE distributor_id='$session_dist_ver' and bank_master_id='".$fetch_product51['bank_id']."'");
					if(mysqli_num_rows($bank_matser_detail)>0)
					{     
						$fetch_product=mysqli_fetch_array($bank_matser_detail);
						$fse_dsr['bank_detail']=$fetch_product['bank_name'];
					} 
				}
				else
				{
					$fse_dsr['bank_detail']='';
				}
				$response['fse_dsr'][]=$fse_dsr;
			}
		}
		$res16=mysqli_query($con,"SELECT * FROM tbl_receipt_transaction,tbl_party where tbl_receipt_transaction.party_id = tbl_party.party_id and tbl_receipt_transaction.generated_user_id='$temp_user_id' and tbl_receipt_transaction.receipt_date>'$last_previous_dsr' and tbl_receipt_transaction.receipt_date<='$cdate' and tbl_receipt_transaction.status='Complete' and tbl_receipt_transaction.source not in ('Web','Admin')");
		if(mysqli_num_rows($res16)>0)
		{     
			while($fetch_product21=mysqli_fetch_assoc($res16))
			{
				extract($fetch_product21);
				$tempCollectionAmt=$tempCollectionAmt+$fetch_product21['total_amount'];
				if($fetch_product21['payment_mode']=='Cash')
					$temp_rcamt=$temp_rcamt+$fetch_product21['cash_amount'];
				else if($fetch_product21['payment_mode']=='Cheque')
					$temp_rchamt=$temp_rchamt+$fetch_product21['cheque_amount'];
				else if($fetch_product21['payment_mode']=='Both')
				{
					$temp_rchamt=$temp_rchamt+$fetch_product21['cheque_amount'];
					$temp_rcamt=$temp_rcamt+$fetch_product21['cash_amount'];
				}
				else if($fetch_product21['payment_mode']=='Online' || $fetch_product21['payment_mode']=='Wallet')
					$temp_ronamt=$temp_ronamt+$fetch_product21['cheque_amount'];
				$fse_dsr['party_detail']=$party_name.' - '.$party_phone;
				$fse_dsr['transaction_bill_number']=$txn_receipt_id;
				$fse_dsr['product_name']='Outstanding';
				$fse_dsr['quantity']='';
				$fse_dsr['amount']=$total_amount;
				$fse_dsr['cash_amt']=$cash_amount;
				if($fetch_product21['payment_mode']=="Cheque" || $fetch_product21['payment_mode']=="Both")
					$fse_dsr['cheque_amt']=$fetch_product21['cheque_amount'];
				else
					$fse_dsr['cheque_amt']=0;
				$fse_dsr['cheque_no']=$cheque_no;
				$fse_dsr['product_disc']=$receipt_disc_amt;
				$fse_dsr['credit_amt']='';
				if($fetch_product21['payment_mode']=="Online" || $fetch_product21['payment_mode']=="Wallet")
					$fse_dsr['online_amt']=$fetch_product21['cheque_amount'];
				else
					$fse_dsr['online_amt']=0;
				if($fetch_product21['bank_id']>0)
				{ 
					$bank_matser_detail=mysqli_query($con,"SELECT * FROM tbl_distributor_bank_master WHERE distributor_id='$session_dist_ver' and bank_master_id='".$fetch_product21['bank_id']."'");
					if(mysqli_num_rows($bank_matser_detail)>0)
					{     
						$fetch_product=mysqli_fetch_array($bank_matser_detail);
						$fse_dsr['bank_detail']=$fetch_product['bank_name'];
					} 
				}
				else
				{
					$fse_dsr['bank_detail']='';
				}
				$response['fse_dsr'][]=$fse_dsr;
			}
		}
		
		$fse_dsr['party_detail']='';
		$fse_dsr['transaction_bill_number']='Total Cash/Cheque against Sale';
		$fse_dsr['product_name']='';
		$fse_dsr['quantity']='';
		$fse_dsr['amount']=$actualGrandamt;
		$fse_dsr['cash_amt']=$temp_camt;
		$fse_dsr['cheque_amt']=$temp_chamt;
		$fse_dsr['cheque_no']='';
		$fse_dsr['product_disc']='';
		$fse_dsr['credit_amt']='';
		$fse_dsr['online_amt']=$temp_online;
		$fse_dsr['bank_detail']='';
		$response['fse_dsr'][]=$fse_dsr;
		
		$fse_dsr['party_detail']='';
		$fse_dsr['transaction_bill_number']='Total Cash/Cheque against receipt/other';
		$fse_dsr['product_name']='';
		$fse_dsr['quantity']='';
		$fse_dsr['amount']='';
		$fse_dsr['cash_amt']=$temp_rcamt;
		$fse_dsr['cheque_amt']=$temp_rchamt;
		$fse_dsr['cheque_no']='';
		$fse_dsr['product_disc']='';
		$fse_dsr['credit_amt']='';
		$fse_dsr['online_amt']=$temp_ronamt;
		$fse_dsr['bank_detail']='';
		$response['fse_dsr'][]=$fse_dsr;
		
		$fse_dsr['party_detail']='';
		$fse_dsr['transaction_bill_number']='Total Grand Amount';
		$fse_dsr['product_name']='';
		$fse_dsr['quantity']='';
		$fse_dsr['amount']=$temp_amt+$temp_credit+$tempCollectionAmt;
		$fse_dsr['cash_amt']=$temp_camt+$temp_rcamt;
		$fse_dsr['cheque_amt']=$temp_chamt+$temp_rchamt;
		$fse_dsr['cheque_no']='';
		$fse_dsr['product_disc']='';
		$fse_dsr['credit_amt']=$temp_credit-$ftempCollectionAmt;
		$fse_dsr['online_amt']=$temp_online+$temp_ronamt;
		$fse_dsr['bank_detail']='';
		$response['fse_dsr'][]=$fse_dsr;
		
		$stock_dsr=array();
		$type_explode=explode('+',$work_type);
		$type_array='';
		for($i=0;$i<sizeof($type_explode);$i++)
		{
			if($type_explode[$i]!='')
			{
				if($i==0)
					$type_array="'".$type_explode[$i]."'";
				else
					$type_array=$type_array.",'".$type_explode[$i]."'";
			}
		}
		$select_product1 = mysqli_query($con,"select * from tbl_product where status='Active' and distributor_id='$session_dist_ver' and product_type in ($type_array)");
		$tamt_opening=0;
		$tamt_stockin=0;
		$tamt_stockout=0;
		$tamt_closing=0;					
		while($fetch_product1=mysqli_fetch_array($select_product1))
		{
			$product_id=$fetch_product1['product_id'];
			$product_name=$fetch_product1['product_name'];
			$product_price=$fetch_product1['product_price'];
			$show_flag=0;
			$product_detail=mysqli_query($con,"SELECT * FROM tbl_user_stock where date<='$cdate' and user_id='$temp_user_id' and product_id='$product_id' order by date DESC limit 1");
			if(mysqli_num_rows($product_detail)>0)
			{     
				while($fetch_detail=mysqli_fetch_array($product_detail))
				{
					$closing_stock=round($fetch_detail['quantity'],2);
					if($closing_stock>0)
						$show_flag=1;
					$product_opening=mysqli_query($con,"SELECT * FROM tbl_user_stock where date<='$last_previous_dsr' and user_id='$temp_user_id' and product_id='$product_id' order by date DESC limit 1");
					while($fetch_detail_opening=mysqli_fetch_array($product_opening))
					{
						$opening_stock=round($fetch_detail_opening['quantity'],2);
						if($opening_stock>0)
							$show_flag=1;
					}
																
					$stockin_detail=mysqli_query($con,"SELECT * FROM tbl_user_request,tbl_user_request_detail where tbl_user_request.transaction_id=tbl_user_request_detail.transaction_id and tbl_user_request.complete_date>'$last_previous_dsr' and tbl_user_request.complete_date<='$cdate' and tbl_user_request.user_id='$temp_user_id' and tbl_user_request_detail.product_id='$product_id' and tbl_user_request.status='Complete'");
					$temp_stockin=0;
					if(mysqli_num_rows($stockin_detail)>0)
					{   
						$show_flag=1;
						while($fetch_stockin=mysqli_fetch_array($stockin_detail))
						{
							$temp_stockin=$temp_stockin+$fetch_stockin['quantity'];
						}
						$stock_in=$temp_stockin;
					}
					else
					{
						$stock_in=$temp_stockin;
					}
															
					$stockout_detail=mysqli_query($con,"SELECT * FROM tbl_party_transaction,tbl_party_transaction_detail where tbl_party_transaction.transaction_id=tbl_party_transaction_detail.transaction_id and tbl_party_transaction.transaction_date>'$last_previous_dsr' and tbl_party_transaction.transaction_date<='$cdate' and tbl_party_transaction.transaction_from='$temp_user_id' and tbl_party_transaction_detail.product_id='$product_id' and tbl_party_transaction.converted_transaction_id='' and tbl_party_transaction.source not in ('Web','Admin')");
					$temp_stockout=0;
					if(mysqli_num_rows($stockout_detail)>0)
					{     
						$show_flag=1;
						while($fetch_stockout=mysqli_fetch_array($stockout_detail))
						{
							$temp_stockout=$temp_stockout+$fetch_stockout['quantity'];
						}
						$stock_out=$temp_stockout;
					}
					else
					{
						$stock_out=$temp_stockout;
					}

					$stockreturn_detail=mysqli_query($con,"SELECT * FROM tbl_distributor_transaction where distributor_id='$session_dist_ver' and transaction_date>'$last_previous_dsr' and transaction_date<='$cdate' and user_id='$temp_user_id' and product_id='$product_id' and txn_type='Return'");
					$temp_stockreturn=0;
					if(mysqli_num_rows($stockreturn_detail)>0)
					{    
						$show_flag=1;
						while($fetch_stockreturn=mysqli_fetch_array($stockreturn_detail))
						{
							$temp_stockreturn=$temp_stockreturn+$fetch_stockreturn['quantity'];
						}
						$stock_return=$temp_stockreturn;
					}
					else
					{
						$stock_return=$temp_stockreturn;
					}
				} 
			}
			if($show_flag==1) {
				$stock_dsr['product_name']=$product_name;
				if($opening_stock=="")
					$stock_dsr['opening_stock']='';
				else
					$stock_dsr['opening_stock']=$opening_stock;
				if($stock_in=="")
					$stock_dsr['stock_issue']='';
				else
					$stock_dsr['stock_issue']=$stock_in;
				if($stock_out=="")
					$stock_dsr['stock_sale']='';
				else
					$stock_dsr['stock_sale']=$stock_out;
				if($stock_return=="")
					$stock_dsr['stock_return']='';
				else
					$stock_dsr['stock_return']=$stock_return;
				if($closing_stock=="")
					$stock_dsr['closing_stock']='';
				else
					$stock_dsr['closing_stock']=$closing_stock;
				$response['stock_dsr'][]=$stock_dsr;
			}
			$opening_stock="";$stock_in="";$stock_out="";$closing_stock="";$stock_return="";
		}
		
		$bank_summary=array();
		$final_bank_summary_amt=0;
		$select_client_bank=mysqli_query($con,"SELECT * FROM tbl_distributor_bank_master WHERE distributor_id='$session_dist_ver' and status='Active'");
		if(mysqli_num_rows($select_client_bank)>0)
		{
			while($fetch_cash_amt=mysqli_fetch_array($select_client_bank))
			{
				$bank_collect_amt=0;
				$bankmaster_id=$fetch_cash_amt['bank_master_id'];
				$bankmaster_name=$fetch_cash_amt['bank_name'];
				$res_bank=mysqli_query($con,"SELECT * FROM tbl_party_transaction,tbl_party where tbl_party_transaction.transaction_to = tbl_party.party_id and tbl_party_transaction.transaction_from='$temp_user_id' and tbl_party_transaction.transaction_date>'$last_previous_dsr' and tbl_party_transaction.transaction_date<='$cdate' and tbl_party_transaction.txn_id='' and tbl_party_transaction.converted_transaction_id='' and tbl_party_transaction.source not in ('Web','Admin') and tbl_party_transaction.bank_id='$bankmaster_id'");
				if(mysqli_num_rows($res_bank)>0)
				{     
					while($fetch_product2=mysqli_fetch_assoc($res_bank))
					{
						if($fetch_product2['payment_mode']=="Online" || $fetch_product2['payment_mode']=="Wallet")
						{
							$bank_collect_amt=$bank_collect_amt+$fetch_product2['final_amt'];
						}
					}
				}
				$res_bank11=mysqli_query($con,"SELECT cheque_amount,payment_mode FROM tbl_receipt_transaction where receipt_date>'$last_previous_dsr' and receipt_date<='$cdate' and generated_user_id='$temp_user_id' and source not in ('Web','Admin') and payment_mode not in ('Adjust Advance Payment','Adjust Credit Note') and bank_id='$bankmaster_id'");
				if(mysqli_num_rows($res_bank11)>0)
				{     
					while($fetch_product21=mysqli_fetch_assoc($res_bank11))
					{
						if($fetch_product21['payment_mode']=="Online" || $fetch_product21['payment_mode']=="Wallet")
						{
							$bank_collect_amt=$bank_collect_amt+$fetch_product21['cheque_amount'];
						}
					}
				}
													
				$res_bank15=mysqli_query($con,"SELECT * FROM tbl_other_receipt_txn where user_id='$temp_user_id' and receipt_date>'$last_previous_dsr' and receipt_date<='$cdate' and status='Complete' and bank_id='$bankmaster_id' and source not in ('Web','Admin')");
				if(mysqli_num_rows($res_bank15)>0)
				{     
					while($fetch_product51=mysqli_fetch_assoc($res_bank15))
					{
						if($fetch_product51['payment_mode']=="Online" || $fetch_product51['payment_mode']=="Wallet")
						{
							$bank_collect_amt=$bank_collect_amt+$fetch_product51['cheque_amount'];
						}
					}
				}
				$final_bank_summary_amt=$final_bank_summary_amt+$bank_collect_amt;
				$bank_summary['bank_name']=$bankmaster_name;
				$bank_summary['collection_amt']=$bank_collect_amt;
				$response['bank_summary'][]=$bank_summary;
			}
		}
		$bank_summary['bank_name']='Total Bank Collection Amount';
		$bank_summary['collection_amt']=$final_bank_summary_amt;
		$response['bank_summary'][]=$bank_summary;
		
		
		$collection_summary=array();
		$select_dsr_collection=mysqli_query($con,"SELECT * FROM tbl_dsr where user_id='$temp_user_id' and tb_insertdate='$cdate' and dsr_status!='Reject'");
		while($fetch_dsr_collection=mysqli_fetch_array($select_dsr_collection))
		{
			$mydsrid=$fetch_dsr_collection['dsr_id'];
			$mydsrdate=$fetch_dsr_collection['date'];
			if($mydsrdate==$cdate)
				$collection_summary['collection_type']='Today Money Collection';
			else
				$collection_summary['collection_type']='Previous Money Collection';
			$collection_summary['collection_date']=$mydsrdate;
			$collection_summary['cheque_detail']=$fetch_dsr_collection['cheque_detail'];
			$collection_summary['online_amt']=$fetch_dsr_collection['online_amt'];
			$response['collection_summary'][]=$collection_summary;
			
			$select_cash=mysqli_query($con,"SELECT * FROM tbl_denomination where status='Active' order by denomination_title DESC");
			$tamt_total=0;
			$temp_demom_name=0;
			$collection_summary_detail=array();
			while($fetch_cash=mysqli_fetch_array($select_cash))
			{
				$denom_id=$fetch_cash['denomination_id'];
				$denom_title=(int)$fetch_cash['denomination_title'];
											
				$user_cash_detail=mysqli_query($con,"SELECT * FROM tbl_dsr,tbl_dsr_cashDetail where tbl_dsr.dsr_id=tbl_dsr_cashDetail.dsr_id and tbl_dsr_cashDetail.denomination_id='$denom_id' and tbl_dsr.dsr_status in ('Pending','Accept') and tbl_dsr.dsr_id='$mydsrid'");
				if(mysqli_num_rows($user_cash_detail)>0)
				{     
					while($fetch_user_cash_detail=mysqli_fetch_array($user_cash_detail))
					{
						$tamt_total=$tamt_total+($fetch_user_cash_detail['total_count']*$denom_title);
						$temp_demom_name=$temp_demom_name+(int)$fetch_user_cash_detail['total_count'];
																	
					}
				}	
				if($temp_demom_name!=0)	{
					$collection_summary_detail['denom_title']=$denom_title;
					$collection_summary_detail['temp_demom_name']=$temp_demom_name;
					$collection_summary_detail['denom_amount']=$denom_title*$temp_demom_name;
					$response['collection_summary_detail'][]=$collection_summary_detail;
					$temp_demom_name=0;
				}
			}
			$collection_summary_detail['denom_title']='Total';
			$collection_summary_detail['temp_demom_name']='';
			$collection_summary_detail['denom_amount']=$tamt_total;
			$response['collection_summary_detail'][]=$collection_summary_detail;
		}
		
		$dsr_deduction_detail=array();
		$select_cash_deduction=mysqli_query($con,"SELECT * FROM tbl_dsr where dsr_status='Accept' and type='System Generated Entry' and date>='$d2_date' and date<='$cdate' and user_id='$temp_user_id'");
		if(mysqli_num_rows($select_cash_deduction)>0)
		{
			$cancel_cash_amt=$cancel_cheque_amt=0;
			while($fetch_cash_amt=mysqli_fetch_array($select_cash_deduction))
			{
				$cancel_cash_amt=$cancel_cash_amt+$fetch_cash_amt['cash_detail'];
				$cancel_cheque_amt=$cancel_cheque_amt+$fetch_cash_amt['cheque_detail'];
			}
			$dsr_deduction_detail['type']='By Invoice / Receipt Cancellation';
			$dsr_deduction_detail['date']=$mydsrdate;
			$dsr_deduction_detail['Cash_Amount']=$cancel_cash_amt;
			$dsr_deduction_detail['Cheque_Amount']=$cancel_cheque_amt;
			$response['dsr_deduction_detail'][]=$dsr_deduction_detail;
		}
		$select_dsr_amt_deduction=mysqli_query($con,"SELECT amount FROM tbl_dsr_bill_edit_adjustment where bill_date>='$d2_date' and bill_date<='$cdate' and fse_id='$temp_user_id'");
		if(mysqli_num_rows($select_dsr_amt_deduction)>0)
		{
			$cancel_total_amt=0;
			while($fetch_cash_amt=mysqli_fetch_array($select_dsr_amt_deduction))
			{
				$cancel_total_amt=$cancel_total_amt+$fetch_cash_amt['amount'];
			}
			$dsr_deduction_detail['type']='By Invoice Edit';
			$dsr_deduction_detail['date']=$mydsrdate;
			$dsr_deduction_detail['Cash_Amount']='Total Deduction Amount';
			$dsr_deduction_detail['Cheque_Amount']=$cancel_total_amt;
			$response['dsr_deduction_detail'][]=$dsr_deduction_detail;
		}
		$response['success']='1';
		$response['details']="Fetch Detail Successful";
	}	
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>